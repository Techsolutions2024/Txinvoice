
import React from 'react';
import { ThongTinHoaDon, ChiTietHangHoaDichVu } from '../types';

interface ExtractedDataDisplayProps {
  data: ThongTinHoaDon;
}

const InfoRow: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500">{label}:</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{String(value)}</dd>
    </div>
  );
};

const formatCurrency = (amount?: number) => {
  if (typeof amount !== 'number') return '';
  return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};

const ExtractedDataDisplay: React.FC<ExtractedDataDisplayProps> = ({ data }) => {
  return (
    <div className="w-full bg-white shadow-xl rounded-xl overflow-hidden mt-8">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 sm:p-6">
        <h3 className="text-2xl font-semibold leading-7 text-white">Thông Tin Hóa Đơn Đã Trích Xuất</h3>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">Thông Tin Chung</h4>
              <InfoRow label="Số hóa đơn" value={data.soHoaDon} />
              <InfoRow label="Ký hiệu mẫu HĐ" value={data.kyHieuMauHoaDon} />
              <InfoRow label="Ký hiệu HĐ" value={data.kyHieuHoaDon} />
              <InfoRow label="Ngày lập" value={data.ngayLap} />
              <InfoRow label="Hình thức thanh toán" value={data.hinhThucThanhToan} />
            </div>
             <div> {/* Spacer or can be used for more general info if needed */}</div>
          </div>


          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
                <h4 className="text-lg font-semibold text-gray-700 mb-3 pt-4 border-t border-gray-200 md:border-t-0">Thông Tin Bên Bán</h4>
                <InfoRow label="Tên đơn vị" value={data.tenDonViBan} />
                <InfoRow label="Mã số thuế" value={data.maSoThueNguoiBan} />
                <InfoRow label="Địa chỉ" value={data.diaChiNguoiBan} />
            </div>
            <div>
                <h4 className="text-lg font-semibold text-gray-700 mb-3 pt-4 border-t border-gray-200 md:border-t-0">Thông Tin Bên Mua</h4>
                <InfoRow label="Tên đơn vị" value={data.tenDonViMua} />
                <InfoRow label="Mã số thuế" value={data.maSoThueNguoiMua} />
                <InfoRow label="Địa chỉ" value={data.diaChiNguoiMua} />
            </div>
          </div>

          {data.danhSachHangHoaDichVu && data.danhSachHangHoaDichVu.length > 0 && (
            <div className="p-4 sm:p-6">
              <h4 className="text-lg font-semibold text-gray-700 mb-3 pt-4 border-t border-gray-200">Chi Tiết Hàng Hóa/Dịch Vụ</h4>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Hàng Hóa/Dịch Vụ</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ĐVT</th>
                      <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Số Lượng</th>
                      <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn Giá</th>
                      <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thành Tiền</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thuế Suất</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.danhSachHangHoaDichVu.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{item.stt ?? index + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.tenHangHoaDichVu}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{item.donViTinh}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{item.soLuong?.toLocaleString('vi-VN')}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(item.donGia)}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 font-medium text-right">{formatCurrency(item.thanhTien)}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{item.thueSuat}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="p-4 sm:p-6">
            <h4 className="text-lg font-semibold text-gray-700 mb-3 pt-4 border-t border-gray-200">Tổng Cộng</h4>
            <div className="space-y-1">
                <InfoRow label="Cộng tiền hàng (trước thuế)" value={formatCurrency(data.congTienHang)} />
                <InfoRow label="Tiền thuế GTGT" value={formatCurrency(data.tienThueGTGT)} />
                <InfoRow label="Tổng cộng thanh toán" value={formatCurrency(data.tongCongThanhToan)} />
                <InfoRow label="Số tiền viết bằng chữ" value={data.soTienVietBangChu} />
            </div>
          </div>
          
          {data.ghiChu && (
            <div className="p-4 sm:p-6 border-t border-gray-200">
                <InfoRow label="Ghi chú" value={data.ghiChu} />
            </div>
          )}
        </dl>
      </div>
    </div>
  );
};

export default ExtractedDataDisplay;
