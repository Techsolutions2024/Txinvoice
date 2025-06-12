import React, { useState, useCallback, ChangeEvent } from 'react';

export interface UploadedFilePayload {
  file: File;
  base64Image: string;
  previewUrl: string;
}

interface InvoiceUploadFormProps {
  onImageUpload: (files: UploadedFilePayload[]) => void;
  isProcessing: boolean;
}

const InvoiceUploadForm: React.FC<InvoiceUploadFormProps> = ({ onImageUpload, isProcessing }) => {
  const [selectedPayloads, setSelectedPayloads] = useState<UploadedFilePayload[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const handleFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) {
      // If user cancels file dialog after selecting files, event.target.files might be empty.
      // Decide if we should clear selectedPayloads or keep existing ones.
      // For now, let's not clear if they already had a selection.
      return;
    }
    
    setFormError(null); // Clear previous form-level errors
    // setSelectedPayloads([]); // Uncomment to clear previous selection when new files are chosen. For now, we append.

    let currentErrors: string[] = [];

    const fileProcessingPromises = files.map(file => {
      return new Promise<UploadedFilePayload | null>((resolve) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          currentErrors.push(`${file.name}: Loại tệp không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP.`);
          resolve(null);
          return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          currentErrors.push(`${file.name}: Kích thước tệp quá lớn (tối đa 5MB).`);
          resolve(null);
          return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
          const previewUrl = reader.result as string;
          const base64Data = previewUrl.split(',')[1];
          if (base64Data) {
            resolve({ file, base64Image: base64Data, previewUrl });
          } else {
            currentErrors.push(`${file.name}: Không thể đọc dữ liệu ảnh.`);
            resolve(null);
          }
        };
        reader.onerror = () => {
           currentErrors.push(`${file.name}: Lỗi khi đọc tệp.`);
           resolve(null);
        };
        reader.readAsDataURL(file);
      });
    });

    const results = await Promise.all(fileProcessingPromises);
    const newValidPayloads = results.filter(p => p !== null) as UploadedFilePayload[];
    
    // Append new valid payloads to existing ones, or replace
    setSelectedPayloads(prevPayloads => [...prevPayloads, ...newValidPayloads]); 
    // If you want to replace: setSelectedPayloads(newValidPayloads);

    if (currentErrors.length > 0) {
      setFormError(currentErrors.join('\n'));
    }
     // Reset the input field value to allow selecting the same file(s) again if needed after clearing
    event.target.value = '';
  }, []);

  const handleSubmit = useCallback(() => {
    if (selectedPayloads.length > 0) {
      onImageUpload(selectedPayloads);
      // Optionally clear payloads after submission:
      // setSelectedPayloads([]); 
    } else {
      setFormError("Vui lòng chọn ít nhất một tệp ảnh hóa đơn.");
    }
  }, [selectedPayloads, onImageUpload]);

  const handleClearSelection = useCallback(() => {
    selectedPayloads.forEach(payload => URL.revokeObjectURL(payload.previewUrl));
    setSelectedPayloads([]);
    setFormError(null);
     // Also reset the file input visually
    const fileInput = document.getElementById('invoice-upload') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
  }, [selectedPayloads]);

  // Clean up object URLs on unmount
  React.useEffect(() => {
    return () => {
      selectedPayloads.forEach(payload => URL.revokeObjectURL(payload.previewUrl));
    };
  }, [selectedPayloads]);


  return (
    <div className="w-full max-w-2xl p-6 bg-white rounded-xl shadow-xl space-y-6">
      <h2 className="text-3xl font-bold text-center text-gray-800">Tải Lên Hóa Đơn</h2>
      
      {formError && (
        <div className="bg-red-50 p-3 rounded-md">
          {formError.split('\n').map((err, idx) => (
            <p key={idx} className="text-sm text-red-600">{err}</p>
          ))}
        </div>
      )}

      <div>
        <label htmlFor="invoice-upload" className="block text-sm font-medium text-gray-700 mb-2">
          Chọn một hoặc nhiều ảnh hóa đơn (JPG, PNG, WEBP, tối đa 5MB mỗi tệp):
        </label>
        <input
          id="invoice-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple // Allow multiple file selection
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2.5 file:px-5
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-100 file:text-blue-700
            hover:file:bg-blue-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:opacity-50 disabled:pointer-events-none
          "
          disabled={isProcessing}
        />
      </div>

      {selectedPayloads.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-700">Các tệp đã chọn ({selectedPayloads.length}):</h3>
          <div className="max-h-60 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            {selectedPayloads.map((payload, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 bg-white rounded-md shadow-sm">
                <img src={payload.previewUrl} alt={`Xem trước ${payload.file.name}`} className="w-16 h-16 object-contain rounded border border-gray-200" />
                <span className="text-sm text-gray-600 truncate" title={payload.file.name}>{payload.file.name}</span>
              </div>
            ))}
          </div>
           <button
            onClick={handleClearSelection}
            disabled={isProcessing}
            className="w-full sm:w-auto px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            Xóa tất cả lựa chọn
          </button>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={selectedPayloads.length === 0 || isProcessing}
        className="w-full flex items-center justify-center px-6 py-3.5 border border-transparent text-base font-semibold rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-150"
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Đang xử lý ({selectedPayloads.length} tệp)...
          </>
        ) : (
          `Trích Xuất Thông Tin ${selectedPayloads.length > 0 ? `(${selectedPayloads.length} tệp)` : ''}`
        )}
      </button>
    </div>
  );
};

export default InvoiceUploadForm;