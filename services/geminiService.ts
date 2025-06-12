
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ThongTinHoaDon } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is not set in environment variables. App may not function correctly.");
  // Potentially throw an error or handle this state in the UI if critical for startup
  // For this example, we'll let it proceed and the error will occur on API call.
}

const ai = new GoogleGenAI({ apiKey: API_KEY! }); // Non-null assertion for API_KEY

const MODEL_NAME = "gemini-2.5-flash-preview-04-17";

const createInvoiceExtractionPrompt = (): string => {
  return `Bạn là một trợ lý AI chuyên nghiệp trong việc đọc và trích xuất thông tin từ hóa đơn GTGT của Việt Nam.
Vui lòng phân tích hình ảnh hóa đơn được cung cấp và trả về thông tin dưới dạng một đối tượng JSON.
Đối tượng JSON phải có cấu trúc như sau, với các khóa bằng tiếng Việt như được chỉ định. Nếu một trường thông tin không có trên hóa đơn, hãy để giá trị là null hoặc bỏ qua trường đó trong JSON.

{
  "tenDonViBan": "string (Tên đơn vị bán hàng)",
  "maSoThueNguoiBan": "string (Mã số thuế người bán)",
  "diaChiNguoiBan": "string (Địa chỉ người bán)",
  "soHoaDon": "string (Số hóa đơn)",
  "kyHieuMauHoaDon": "string (Ký hiệu mẫu hóa đơn, ví dụ: 01GTKT0/001)",
  "kyHieuHoaDon": "string (Ký hiệu hóa đơn, ví dụ: AA/23E)",
  "ngayLap": "string (Ngày, tháng, năm lập hóa đơn, định dạng DD/MM/YYYY)",
  "tenDonViMua": "string (Tên đơn vị mua hàng)",
  "maSoThueNguoiMua": "string (Mã số thuế người mua)",
  "diaChiNguoiMua": "string (Địa chỉ người mua)",
  "hinhThucThanhToan": "string (Hình thức thanh toán, ví dụ: TM, CK)",
  "danhSachHangHoaDichVu": [
    {
      "stt": "string | number (Số thứ tự)",
      "tenHangHoaDichVu": "string (Tên hàng hóa, dịch vụ)",
      "donViTinh": "string (Đơn vị tính)",
      "soLuong": "number (Số lượng)",
      "donGia": "number (Đơn giá)",
      "thanhTien": "number (Thành tiền trước thuế)",
      "thueSuat": "string (Thuế suất GTGT, ví dụ '5%', '10%', 'KCT')"
    }
  ],
  "congTienHang": "number (Cộng tiền hàng trước thuế GTGT)",
  "tienThueGTGT": "number (Tổng tiền thuế GTGT)",
  "tongCongThanhToan": "number (Tổng cộng tiền thanh toán sau thuế)",
  "soTienVietBangChu": "string (Số tiền viết bằng chữ)",
  "ghiChu": "string (Ghi chú, nếu có)"
}

Chỉ trích xuất văn bản từ hóa đơn. Đảm bảo rằng các giá trị số (số lượng, đơn giá, thành tiền, v.v.) được trả về dưới dạng số (number), không phải chuỗi (string), trừ khi không thể chuyển đổi hoặc trường đó là STT. Ngày tháng phải ở định dạng DD/MM/YYYY.
`;
};

export const extractInvoiceDataFromImage = async (
  base64Image: string,
  mimeType: string
): Promise<ThongTinHoaDon> => {
  if (!API_KEY) {
    throw new Error("API Key chưa được cấu hình. Vui lòng kiểm tra biến môi trường API_KEY.");
  }
  
  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType,
    },
  };

  const textPart = {
    text: createInvoiceExtractionPrompt(),
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ parts: [imagePart, textPart] }],
      config: {
        responseMimeType: "application/json",
        // No thinkingConfig needed for this task, default behavior is fine.
      }
    });
    
    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const parsedData = JSON.parse(jsonStr);
    return parsedData as ThongTinHoaDon;

  } catch (error) {
    console.error("Lỗi khi gọi Gemini API hoặc xử lý phản hồi:", error);
    if (error instanceof Error) {
        // Check for specific Gemini API related error messages if available
        if (error.message.includes("API key not valid")) {
             throw new Error("API Key không hợp lệ. Vui lòng kiểm tra lại.");
        }
         throw new Error(`Không thể trích xuất dữ liệu: ${error.message}`);
    }
    throw new Error("Lỗi không xác định khi trích xuất dữ liệu hóa đơn.");
  }
};
