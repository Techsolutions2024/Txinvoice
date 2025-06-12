
export interface ChiTietHangHoaDichVu {
  stt?: string | number;
  tenHangHoaDichVu: string;
  donViTinh?: string;
  soLuong?: number;
  donGia?: number;
  thanhTien: number;
  thueSuat?: string; // e.g., "5%", "10%", "KCT" (Không chịu thuế)
}

export interface ThongTinHoaDon {
  tenDonViBan?: string;
  maSoThueNguoiBan?: string;
  diaChiNguoiBan?: string;
  soHoaDon?: string;
  kyHieuMauHoaDon?: string; 
  kyHieuHoaDon?: string; 
  ngayLap?: string; // Expected format: DD/MM/YYYY
  tenDonViMua?: string;
  maSoThueNguoiMua?: string;
  diaChiNguoiMua?: string;
  hinhThucThanhToan?: string;
  danhSachHangHoaDichVu?: ChiTietHangHoaDichVu[];
  congTienHang?: number;
  tienThueGTGT?: number;
  tongCongThanhToan?: number;
  soTienVietBangChu?: string;
  ghiChu?: string;
}
