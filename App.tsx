
import React, { useState, useCallback, useEffect } from 'react';
import { ThongTinHoaDon } from './types';
import InvoiceUploadForm, { UploadedFilePayload } from './components/InvoiceUploadForm';
import ExtractedDataDisplay from './components/ExtractedDataDisplay';
import LoadingIcon from './components/LoadingIcon';
import ErrorAlert from './components/ErrorAlert';
import { extractInvoiceDataFromImage } from './services/geminiService';

const formatMarkdownCurrency = (amount?: number) => {
  if (typeof amount !== 'number') return '';
  return amount.toLocaleString('vi-VN') + ' VND';
};

const generateMarkdownContent = (data: ThongTinHoaDon): string => {
  let md = `# Thông Tin Hóa Đơn TxInvoice\n\n`;

  md += `## Thông Tin Chung\n`;
  if (data.soHoaDon) md += `- **Số hóa đơn:** ${data.soHoaDon}\n`;
  if (data.kyHieuMauHoaDon) md += `- **Ký hiệu mẫu HĐ:** ${data.kyHieuMauHoaDon}\n`;
  if (data.kyHieuHoaDon) md += `- **Ký hiệu HĐ:** ${data.kyHieuHoaDon}\n`;
  if (data.ngayLap) md += `- **Ngày lập:** ${data.ngayLap}\n`;
  if (data.hinhThucThanhToan) md += `- **Hình thức thanh toán:** ${data.hinhThucThanhToan}\n`;
  md += `\n`;

  if (data.tenDonViBan || data.maSoThueNguoiBan || data.diaChiNguoiBan) {
    md += `## Thông Tin Bên Bán\n`;
    if (data.tenDonViBan) md += `- **Tên đơn vị:** ${data.tenDonViBan}\n`;
    if (data.maSoThueNguoiBan) md += `- **Mã số thuế:** ${data.maSoThueNguoiBan}\n`;
    if (data.diaChiNguoiBan) md += `- **Địa chỉ:** ${data.diaChiNguoiBan}\n`;
    md += `\n`;
  }

  if (data.tenDonViMua || data.maSoThueNguoiMua || data.diaChiNguoiMua) {
    md += `## Thông Tin Bên Mua\n`;
    if (data.tenDonViMua) md += `- **Tên đơn vị:** ${data.tenDonViMua}\n`;
    if (data.maSoThueNguoiMua) md += `- **Mã số thuế:** ${data.maSoThueNguoiMua}\n`;
    if (data.diaChiNguoiMua) md += `- **Địa chỉ:** ${data.diaChiNguoiMua}\n`;
    md += `\n`;
  }

  if (data.danhSachHangHoaDichVu && data.danhSachHangHoaDichVu.length > 0) {
    md += `## Chi Tiết Hàng Hóa/Dịch Vụ\n`;
    md += `| STT | Tên Hàng Hóa/Dịch Vụ | ĐVT | Số Lượng | Đơn Giá | Thành Tiền | Thuế Suất |\n`;
    md += `|---|---|---|---|---|---|---|\n`;
    data.danhSachHangHoaDichVu.forEach((item, index) => {
      md += `| ${item.stt ?? index + 1} | ${item.tenHangHoaDichVu || ''} | ${item.donViTinh || ''} | ${item.soLuong?.toLocaleString('vi-VN') || ''} | ${formatMarkdownCurrency(item.donGia)} | ${formatMarkdownCurrency(item.thanhTien)} | ${item.thueSuat || ''} |\n`;
    });
    md += `\n`;
  }

  md += `## Tổng Cộng\n`;
  if (data.congTienHang !== undefined && data.congTienHang !== null) md += `- **Cộng tiền hàng (trước thuế):** ${formatMarkdownCurrency(data.congTienHang)}\n`;
  if (data.tienThueGTGT !== undefined && data.tienThueGTGT !== null) md += `- **Tiền thuế GTGT:** ${formatMarkdownCurrency(data.tienThueGTGT)}\n`;
  if (data.tongCongThanhToan !== undefined && data.tongCongThanhToan !== null) md += `- **Tổng cộng thanh toán:** ${formatMarkdownCurrency(data.tongCongThanhToan)}\n`;
  if (data.soTienVietBangChu) md += `- **Số tiền viết bằng chữ:** ${data.soTienVietBangChu}\n`;
  md += `\n`;
  
  if (data.ghiChu) {
    md += `## Ghi Chú\n`;
    md += `${data.ghiChu}\n`;
  }

  return md;
};

interface ProcessedInvoiceResult {
  id: string;
  file: File;
  previewUrl: string;
  data?: ThongTinHoaDon;
  error?: string;
}

const App: React.FC = () => {
  const [processedInvoices, setProcessedInvoices] = useState<ProcessedInvoiceResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null); // For errors not tied to a specific file

  const handleImageUpload = useCallback(async (filesToProcess: UploadedFilePayload[]) => {
    setIsLoading(true);
    setGlobalError(null);
    
    const initialStates: ProcessedInvoiceResult[] = filesToProcess.map((payload) => ({
      id: payload.file.name + '-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
      file: payload.file,
      previewUrl: payload.previewUrl, 
    }));
    setProcessedInvoices(initialStates);

    const processingPromises = filesToProcess.map(async (payload, index) => {
      try {
        const data = await extractInvoiceDataFromImage(payload.base64Image, payload.file.type);
        return {
          ...initialStates[index], 
          data,
        };
      } catch (err) {
        return {
          ...initialStates[index], 
          error: err instanceof Error ? err.message : 'Lỗi không xác định khi xử lý tệp.',
        };
      }
    });

    const results = await Promise.all(processingPromises);
    setProcessedInvoices(results);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      processedInvoices.forEach(invoice => {
        if (invoice.previewUrl.startsWith('blob:')) { 
           URL.revokeObjectURL(invoice.previewUrl);
        }
      });
    };
  }, [processedInvoices]);


  const handleDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleDownloadJson = useCallback((data: ThongTinHoaDon, originalFile: File) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const filename = `txinvoice_${originalFile.name.split('.').slice(0, -1).join('.') || originalFile.name}.json`;
    handleDownload(filename, jsonContent, 'application/json');
  }, []);

  const handleDownloadMarkdown = useCallback((data: ThongTinHoaDon, originalFile: File) => {
    const markdownContent = generateMarkdownContent(data);
    const filename = `txinvoice_${originalFile.name.split('.').slice(0, -1).join('.') || originalFile.name}.md`;
    handleDownload(filename, markdownContent, 'text/markdown;charset=utf-8');
  }, []);


  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 flex flex-col items-center">
      <header className="mb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-700">
          TxInvoice
        </h1>
        <p className="text-slate-600 mt-3 text-lg sm:text-xl">
          Tải lên nhiều ảnh hóa đơn tiếng Việt để tự động trích xuất thông tin.
        </p>
      </header>

      <main className="w-full max-w-3xl mx-auto">
        <InvoiceUploadForm onImageUpload={handleImageUpload} isProcessing={isLoading} />

        {isLoading && processedInvoices.length > 0 && (
          <div className="mt-8 flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg">
            <LoadingIcon className="w-12 h-12 text-blue-600" />
            <p className="mt-4 text-lg font-medium text-slate-700">Đang phân tích {processedInvoices.length} hóa đơn...</p>
            <p className="text-sm text-slate-500">Quá trình này có thể mất vài giây đến vài phút tùy số lượng.</p>
          </div>
        )}

        {globalError && (
          <div className="mt-8">
            <ErrorAlert message={globalError} />
          </div>
        )}

        {!isLoading && processedInvoices.length > 0 && (
          <div className="mt-10 space-y-8">
            <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3">Kết Quả Trích Xuất</h2>
            {processedInvoices.map((item) => (
              <div key={item.id} className="p-5 bg-white rounded-xl shadow-lg ring-1 ring-gray-200">
                <h3 className="text-xl font-semibold text-gray-700 mb-3 truncate" title={item.file.name}>
                  Tệp: <span className="font-mono text-blue-600">{item.file.name}</span>
                </h3>
                {item.previewUrl && (
                    <div className="mb-4 p-2 bg-gray-50 rounded-md border border-gray-200">
                        <img 
                            src={item.previewUrl} 
                            alt={`Xem trước ${item.file.name}`} 
                            className="max-w-full h-auto max-h-80 rounded-md object-contain mx-auto"
                        />
                    </div>
                )}
                
                {item.error && <ErrorAlert message={`Lỗi xử lý tệp: ${item.error}`} />}
                
                {item.data && <ExtractedDataDisplay data={item.data} />}
                
                {item.data && (
                  <div className="mt-5 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                    <button
                      onClick={() => handleDownloadJson(item.data!, item.file)}
                      className="w-full sm:w-auto flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                      aria-label={`Tải JSON cho ${item.file.name}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Tải JSON
                    </button>
                    <button
                      onClick={() => handleDownloadMarkdown(item.data!, item.file)}
                      className="w-full sm:w-auto flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
                      aria-label={`Tải Markdown cho ${item.file.name}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Tải Markdown
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="mt-24 mb-10 w-full max-w-4xl mx-auto px-6 text-sm text-slate-600 border-t border-slate-300 pt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">TxInvoice</h3>
            <p>&copy; {new Date().getFullYear()} TxTeams.</p>
            <p>Giải pháp hóa đơn thông minh.</p>
          </div>

          <div className="md:col-span-1">
            <h3 className="text-md font-semibold text-slate-700 mb-3">Giải Pháp AI Của Chúng Tôi</h3>
            <p className="leading-relaxed">
              Chuyên cung cấp các giải pháp AI tiên tiến: Computer Vision, Face Recognition, People Counting, Heatmap Instore Analytics, Traffic Monitor, Chatbot, AI Agents, OCR và các ứng dụng tùy chỉnh khác.
            </p>
          </div>

          <div className="md:col-span-1">
            <h3 className="text-md font-semibold text-slate-700 mb-3">Liên Hệ Với Chúng Tôi</h3>
            <ul className="space-y-2">
              <li>
                <a href="tel:+84898336308" className="inline-flex items-center hover:text-blue-600 transition-colors group">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-500 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+84 898 336 308</span>
                </a>
              </li>
              <li>
                <a href="https://wa.me/84898336308" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-green-600 transition-colors group">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-500 group-hover:text-green-600 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.47.074-.669.347-.198.272-.768.768-.768 1.852 0 1.084.793 2.147.916 2.321.124.172 1.557 2.501 3.783 3.537 2.229 1.036 2.229.69.267.641.495.025.768.173.967.347.346.297.346.521.223.793.124.271.124.521.025.641a.48.48 0 01-.124.074c-.075.025-.198.025-.272.025a.48.48 0 01-.124-.025c-.075-.025-.198-.025-.272-.025l-.124-.025c-.198 0-.47.074-.669.347-.198.272-.768.768-.768 1.852 0 1.084.793 2.147.916 2.321s1.557 2.501 3.783 3.537c.495.224.896.335 1.255.422.57.149 1.148.118 1.571.074.495-.05.768-.173.967-.347.198-.173.198-.347.223-.521.025-.172.025-.347-.05-.495z"/>
                  </svg>
                  <span>WhatsApp: +84 898 336 308</span>
                </a>
              </li>
              <li>
                <span className="inline-flex items-center group">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span>Zalo: +84 898 336 308</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 text-center text-xs text-slate-500">
          <p>TxInvoice - Tự động hóa quy trình xử lý hóa đơn của bạn.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
