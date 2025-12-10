import React from 'react';
import { Info } from 'lucide-react';
import { INSURANCE_RATES, LUONG_CO_BAN, BHXH_MAX_CAP, formatCurrency } from '../utils/taxCalculator';

export const DeductionDetailTable: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          Chi tiết các khoản đóng góp và giảm trừ
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Bảng chi tiết các khoản bảo hiểm xã hội, thuế, và giảm trừ với tỷ lệ phần trăm
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Loại</th>
              <th className="px-4 py-3">Tỷ lệ (%)</th>
              <th className="px-4 py-3">Mô tả</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Insurance Section */}
            <tr className="bg-blue-50/50">
              <td colSpan={3} className="px-4 py-2 font-semibold text-blue-900">
                Bảo hiểm bắt buộc
              </td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3">BHXH (Bảo hiểm xã hội)</td>
              <td className="px-4 py-3 font-bold text-blue-600">{(INSURANCE_RATES.bhxh * 100).toFixed(1)}%</td>
              <td className="px-4 py-3 text-slate-500">
                Tính trên lương tối đa {formatCurrency(BHXH_MAX_CAP)}
                <br />
                <span className="text-xs">(20 lần lương cơ bản {formatCurrency(LUONG_CO_BAN)})</span>
              </td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3">BHYT (Bảo hiểm y tế)</td>
              <td className="px-4 py-3 font-bold text-blue-600">{(INSURANCE_RATES.bhyt * 100).toFixed(1)}%</td>
              <td className="px-4 py-3 text-slate-500">
                Tính trên lương tối đa {formatCurrency(BHXH_MAX_CAP)}
              </td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3">BHTN (Bảo hiểm thất nghiệp)</td>
              <td className="px-4 py-3 font-bold text-blue-600">{(INSURANCE_RATES.bhtn * 100).toFixed(1)}%</td>
              <td className="px-4 py-3 text-slate-500">
                Tính trên lương tối đa {formatCurrency(BHXH_MAX_CAP)}
              </td>
            </tr>
            <tr className="bg-blue-100">
              <td className="px-4 py-3 font-bold">Tổng bảo hiểm</td>
              <td className="px-4 py-3 font-bold text-blue-700">{(INSURANCE_RATES.total * 100).toFixed(1)}%</td>
              <td className="px-4 py-3 text-slate-600 font-medium">
                Tổng các khoản bảo hiểm bắt buộc
              </td>
            </tr>

            {/* Deduction Section */}
            <tr className="bg-green-50/50">
              <td colSpan={3} className="px-4 py-2 font-semibold text-green-900">
                Giảm trừ gia cảnh (Hiệu lực từ 1/1/2026)
              </td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3">Giảm trừ bản thân (cũ)</td>
              <td className="px-4 py-3 font-medium text-slate-500">-</td>
              <td className="px-4 py-3 text-slate-500">
                {formatCurrency(11_000_000)}/tháng
              </td>
            </tr>
            <tr className="hover:bg-slate-50 bg-green-50/30">
              <td className="px-4 py-3 font-medium">Giảm trừ bản thân (mới)</td>
              <td className="px-4 py-3 font-bold text-green-600">-</td>
              <td className="px-4 py-3 text-green-700 font-semibold">
                {formatCurrency(15_500_000)}/tháng (+{formatCurrency(4_500_000)})
              </td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3">Giảm trừ người phụ thuộc (cũ)</td>
              <td className="px-4 py-3 font-medium text-slate-500">-</td>
              <td className="px-4 py-3 text-slate-500">
                {formatCurrency(4_400_000)}/người/tháng
              </td>
            </tr>
            <tr className="hover:bg-slate-50 bg-green-50/30">
              <td className="px-4 py-3 font-medium">Giảm trừ người phụ thuộc (mới)</td>
              <td className="px-4 py-3 font-bold text-green-600">-</td>
              <td className="px-4 py-3 text-green-700 font-semibold">
                {formatCurrency(6_200_000)}/người/tháng (+{formatCurrency(1_800_000)})
              </td>
            </tr>

            {/* Tax Brackets Section */}
            <tr className="bg-orange-50/50">
              <td colSpan={3} className="px-4 py-2 font-semibold text-orange-900">
                Thuế TNCN lũy tiến (Hiệu lực từ 1/7/2026)
              </td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3">Bậc 1: Đến 10 triệu</td>
              <td className="px-4 py-3 font-bold text-orange-600">5%</td>
              <td className="px-4 py-3 text-slate-500">Thu nhập tính thuế/tháng</td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3">Bậc 2: Trên 10 - 30 triệu</td>
              <td className="px-4 py-3 font-bold text-orange-600">15%</td>
              <td className="px-4 py-3 text-slate-500">Thu nhập tính thuế/tháng</td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3">Bậc 3: Trên 30 - 60 triệu</td>
              <td className="px-4 py-3 font-bold text-orange-600">25%</td>
              <td className="px-4 py-3 text-slate-500">Thu nhập tính thuế/tháng</td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3">Bậc 4: Trên 60 - 100 triệu</td>
              <td className="px-4 py-3 font-bold text-orange-600">30%</td>
              <td className="px-4 py-3 text-slate-500">Thu nhập tính thuế/tháng</td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3">Bậc 5: Trên 100 triệu</td>
              <td className="px-4 py-3 font-bold text-orange-600">35%</td>
              <td className="px-4 py-3 text-slate-500">Thu nhập tính thuế/tháng</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-amber-50 border-t border-amber-100">
        <p className="text-xs text-amber-800">
          <strong>Lưu ý:</strong> Mức giảm trừ mới có hiệu lực từ 1/1/2026, trong khi biểu thuế mới có hiệu lực từ 1/7/2026. 
          BHXH được tính trên mức lương tối đa là 20 lần lương cơ bản (46.800.000 VND).
        </p>
      </div>
    </div>
  );
};
