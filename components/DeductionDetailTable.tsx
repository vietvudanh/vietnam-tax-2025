import React from 'react';
import { Info } from 'lucide-react';
import { INSURANCE_RATES, LUONG_CO_BAN, BHXH_MAX_CAP, formatCurrency, OLD_CONFIG, NEW_CONFIG } from '../utils/taxCalculator';
import {
  MEAL_ALLOWANCE_CAP_OLD,
  MEAL_ALLOWANCE_CAP_NEW,
  MEDICAL_DEDUCTION_CAP_YEAR,
  EDUCATION_DEDUCTION_CAP_YEAR,
  DEPENDENT_INCOME_THRESHOLD,
  MONTHS_PER_YEAR,
  TaxPeriod,
} from '../types';

interface DeductionDetailTableProps {
  /** Kỳ tính thuế đang xem. Kỳ năm hiển thị mốc bậc thuế đã nhân 12. */
  period?: TaxPeriod;
}

export const DeductionDetailTable: React.FC<DeductionDetailTableProps> = ({ period = 'month' }) => {
  const isYear = period === 'year';
  // Biểu thuế trong luật ghi theo THÁNG. Khi quyết toán năm thì mọi mốc nhân 12.
  const bracketScale = isYear ? MONTHS_PER_YEAR : 1;
  const periodSuffix = isYear ? '/năm' : '/tháng';

  const bracketLabel = (min: number, max: number | null): string => {
    const lo = min * bracketScale;
    const hi = max === null ? null : max * bracketScale;
    if (min === 0) return `Đến ${lo === 0 ? hi : hi} triệu`;
    return hi === null ? `Trên ${lo} triệu` : `Trên ${lo} - ${hi} triệu`;
  };

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
        {isYear && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-2 mt-2">
            Luật quy định biểu thuế và mức giảm trừ theo <strong>tháng</strong>. Đang ở chế độ quyết
            toán năm nên các mốc dưới đây đã được nhân 12. Riêng trần đóng bảo hiểm vẫn là trần
            tháng - áp cho từng tháng rồi mới cộng lại.
          </p>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Loại</th>
              <th className="px-4 py-3">Tỷ lệ (%)</th>
              <th className="px-4 py-3">Giá trị cũ (VNĐ)</th>
              <th className="px-4 py-3">Giá trị mới (VNĐ)</th>
              <th className="px-4 py-3">Mô tả</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Insurance Section */}
            <tr className="bg-blue-50/50">
              <td colSpan={5} className="px-4 py-2 font-semibold text-blue-900">
                Bảo hiểm bắt buộc
              </td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3">BHXH (Bảo hiểm xã hội)</td>
              <td className="px-4 py-3 font-bold text-blue-600">{(INSURANCE_RATES.bhxh * 100).toFixed(1)}%</td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3 text-slate-500">
                Tính trên lương tối đa {formatCurrency(BHXH_MAX_CAP)}
                <br />
                <span className="text-xs">(20 lần lương cơ bản {formatCurrency(LUONG_CO_BAN)})</span>
              </td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3">BHYT (Bảo hiểm y tế)</td>
              <td className="px-4 py-3 font-bold text-blue-600">{(INSURANCE_RATES.bhyt * 100).toFixed(1)}%</td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3 text-slate-500">
                Tính trên lương tối đa {formatCurrency(BHXH_MAX_CAP)}
              </td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3">BHTN (Bảo hiểm thất nghiệp)</td>
              <td className="px-4 py-3 font-bold text-blue-600">{(INSURANCE_RATES.bhtn * 100).toFixed(1)}%</td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3 text-slate-500">
                Tính trên lương tối đa {formatCurrency(BHXH_MAX_CAP)}
              </td>
            </tr>
            <tr className="bg-blue-100">
              <td className="px-4 py-3 font-bold">Tổng bảo hiểm</td>
              <td className="px-4 py-3 font-bold text-blue-700">{(INSURANCE_RATES.total * 100).toFixed(1)}%</td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3 text-slate-600 font-medium">
                Tổng các khoản bảo hiểm bắt buộc
              </td>
            </tr>

            {/* Deduction Section */}
            <tr className="bg-green-50/50">
              <td colSpan={5} className="px-4 py-2 font-semibold text-green-900">
                Giảm trừ gia cảnh (Hiệu lực từ 1/1/2026)
              </td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3">Giảm trừ bản thân</td>
              <td className="px-4 py-3 font-medium text-slate-500">-</td>
              <td className="px-4 py-3 text-slate-500">{formatCurrency(OLD_CONFIG.personalDeduction * bracketScale)}</td>
              <td className="px-4 py-3 text-green-700 font-semibold">{formatCurrency(NEW_CONFIG.personalDeduction * bracketScale)}</td>
              <td className="px-4 py-3 text-slate-500">
                {periodSuffix} (+{formatCurrency((NEW_CONFIG.personalDeduction - OLD_CONFIG.personalDeduction) * bracketScale)})
              </td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3">Giảm trừ người phụ thuộc</td>
              <td className="px-4 py-3 font-medium text-slate-500">-</td>
              <td className="px-4 py-3 text-slate-500">{formatCurrency(OLD_CONFIG.dependentDeduction * bracketScale)}</td>
              <td className="px-4 py-3 text-green-700 font-semibold">{formatCurrency(NEW_CONFIG.dependentDeduction * bracketScale)}</td>
              <td className="px-4 py-3 text-slate-500">
                /người{periodSuffix} (+{formatCurrency((NEW_CONFIG.dependentDeduction - OLD_CONFIG.dependentDeduction) * bracketScale)})
              </td>
            </tr>

            {/* Exemptions - Nghị định 253/2026/NĐ-CP */}
            <tr className="bg-emerald-50/50">
              <td colSpan={5} className="px-4 py-2 font-semibold text-emerald-900">
                Miễn thuế & giảm trừ khác (Nghị định 253/2026/NĐ-CP, từ 1/7/2026)
              </td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3">Tiền ăn giữa ca, ăn trưa</td>
              <td className="px-4 py-3 font-medium text-slate-500">-</td>
              <td className="px-4 py-3 text-slate-500">{formatCurrency(MEAL_ALLOWANCE_CAP_OLD)}</td>
              <td className="px-4 py-3 text-green-700 font-semibold">{formatCurrency(MEAL_ALLOWANCE_CAP_NEW)}</td>
              <td className="px-4 py-3 text-slate-500">
                /người/tháng - phần vượt hạn mức tính vào thu nhập chịu thuế
              </td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3">Lương làm thêm giờ, làm ban đêm</td>
              <td className="px-4 py-3 font-medium text-slate-500">-</td>
              <td className="px-4 py-3 text-slate-500">Chỉ miễn phần chênh lệch</td>
              <td className="px-4 py-3 text-green-700 font-semibold">Miễn toàn bộ</td>
              <td className="px-4 py-3 text-slate-500">
                Điều 26 NĐ 253/2026/NĐ-CP - cần bảng kê giờ làm thêm, làm đêm
              </td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3">Chi phí khám, chữa bệnh</td>
              <td className="px-4 py-3 font-medium text-slate-500">-</td>
              <td className="px-4 py-3 text-slate-500">Không có</td>
              <td className="px-4 py-3 text-green-700 font-semibold">{formatCurrency(MEDICAL_DEDUCTION_CAP_YEAR)}</td>
              <td className="px-4 py-3 text-slate-500">
                /năm - tại cơ sở y tế trong nước, trong danh mục BHYT chi trả
              </td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3">Chi phí giáo dục - đào tạo</td>
              <td className="px-4 py-3 font-medium text-slate-500">-</td>
              <td className="px-4 py-3 text-slate-500">Không có</td>
              <td className="px-4 py-3 text-green-700 font-semibold">{formatCurrency(EDUCATION_DEDUCTION_CAP_YEAR)}</td>
              <td className="px-4 py-3 text-slate-500">
                /năm - học phí mầm non đến đại học tại cơ sở trong nước
              </td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3">Ngưỡng thu nhập của người phụ thuộc</td>
              <td className="px-4 py-3 font-medium text-slate-500">-</td>
              <td className="px-4 py-3 text-slate-500">{formatCurrency(1_000_000)}</td>
              <td className="px-4 py-3 text-green-700 font-semibold">{formatCurrency(DEPENDENT_INCOME_THRESHOLD)}</td>
              <td className="px-4 py-3 text-slate-500">
                Bình quân tháng - Thông tư 87/2026/TT-BTC
              </td>
            </tr>

            {/* Tax Brackets Section */}
            <tr className="bg-orange-50/50">
              <td colSpan={5} className="px-4 py-2 font-semibold text-orange-900">
                Thuế TNCN lũy tiến (Hiệu lực từ 1/7/2026)
              </td>
            </tr>
            {/* Đọc thẳng từ NEW_CONFIG để bảng không bao giờ lệch với phép tính */}
            {NEW_CONFIG.brackets.map((bracket, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  Bậc {index + 1}: {bracketLabel(bracket.min, bracket.max)}
                </td>
                <td className="px-4 py-3 font-bold text-orange-600">{bracket.rate}%</td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-slate-500">Thu nhập tính thuế{periodSuffix}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-amber-50 border-t border-amber-100">
        <p className="text-xs text-amber-800">
          <strong>Lưu ý:</strong> Nghị định 253/2026/NĐ-CP có hiệu lực từ 1/7/2026. Các quy định về thu nhập từ tiền lương,
          tiền công của cá nhân cư trú (mức giảm trừ, biểu thuế 5 bậc) áp dụng từ kỳ tính thuế năm 2026;
          riêng quy định về tiền ăn giữa ca, ăn trưa áp dụng từ 1/7/2026.
          BHXH được tính trên mức lương tối đa là 20 lần lương cơ bản (46.800.000 VND).
        </p>
      </div>
    </div>
  );
};
