import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';
import {
  calculateComparison,
  formatCurrency,
  OLD_CONFIG,
  NEW_CONFIG,
  REGIONAL_MIN_WAGE_2026,
} from '../utils/taxCalculator';

// Biểu đồ không có ô chọn vùng nên mặc định lấy vùng I. Vùng chỉ ảnh hưởng tới trần đóng BHTN
// (20 × lương tối thiểu vùng), tức chỉ bắt đầu tạo chênh lệch từ mức Gross ~99 triệu trở lên
// và chênh lệch đó chưa tới vài nghìn đồng tiền thuế, không làm đổi hình dáng đường cong.
const CHART_REGION = 'I' as const;
// Dùng lương tối thiểu vùng hiện hành (NĐ 293/2025/NĐ-CP) cho khớp với mặc định của trang tính.
const CHART_MIN_WAGE = REGIONAL_MIN_WAGE_2026[CHART_REGION];

interface ReductionPoint {
  /** Lương Gross, đơn vị triệu đồng (trục X) */
  gross: number;
  /** Thuế theo quy định cũ, đơn vị triệu đồng */
  oldTax: number;
  /** Thuế theo quy định mới, đơn vị triệu đồng */
  newTax: number;
  /** Mức giảm = thuế cũ - thuế mới, đơn vị triệu đồng */
  reduction: number;
}

/** Hiển thị số triệu đồng theo định dạng tiếng Việt (dấu phẩy thập phân) */
const formatMillion = (value: number): string =>
  value.toLocaleString('vi-VN', { maximumFractionDigits: 3 });

export const TaxReductionChart: React.FC = () => {
  const [dependentsStr, setDependentsStr] = useState('0');
  const dependents = parseInt(dependentsStr) || 0;

  const data = useMemo<ReductionPoint[]>(() => {
    const chartData: ReductionPoint[] = [];
    for (let gross = 10_000_000; gross <= 200_000_000; gross += 5_000_000) {
      // calculateComparison áp dụng CÙNG một cặp giảm trừ cho cả hai biểu thuế, trong khi biểu đồ
      // này cần mỗi luật chạy đúng mức giảm trừ của chính nó. Vì vậy phải gọi hai lần: lần đầu
      // với giảm trừ luật cũ (lấy .oldReg), lần sau với giảm trừ luật mới (lấy .newReg).
      const withOldDeductions = calculateComparison(
        gross,
        dependents,
        CHART_REGION,
        null,
        OLD_CONFIG.personalDeduction,
        OLD_CONFIG.dependentDeduction,
        CHART_MIN_WAGE
      );
      const withNewDeductions = calculateComparison(
        gross,
        dependents,
        CHART_REGION,
        null,
        NEW_CONFIG.personalDeduction,
        NEW_CONFIG.dependentDeduction,
        CHART_MIN_WAGE
      );

      const oldTax = withOldDeductions.oldReg.taxAmount;
      const newTax = withNewDeductions.newReg.taxAmount;
      const reduction = oldTax - newTax;

      chartData.push({
        gross: gross / 1_000_000,
        oldTax: oldTax / 1_000_000,
        newTax: newTax / 1_000_000,
        reduction: reduction / 1_000_000,
      });
    }
    return chartData;
  }, [dependents]);

  // Các mốc rút ra trực tiếp từ dữ liệu để phần "Nhận xét" luôn khớp với đường cong.
  const insights = useMemo(() => {
    const maxReduction = data.reduce(
      (max: number, point: ReductionPoint) => Math.max(max, point.reduction),
      0
    );
    const plateauPoint = data.find(
      (point: ReductionPoint) => point.reduction >= maxReduction - 1e-9
    );
    const fiveMilestone = data.find((point: ReductionPoint) => point.reduction >= 5);
    return {
      maxReduction,
      plateauGross: plateauPoint ? plateauPoint.gross : null,
      fiveMilestoneGross: fiveMilestone ? fiveMilestone.gross : null,
    };
  }, [data]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">
          So sánh Mức Giảm Thuế TNCN (từ 1/7/2026)
        </h2>
        <p className="text-slate-500 italic text-sm">
          Phân tích mức lương Gross cần thiết để tăng 5 triệu VNĐ thu nhập thực nhận chỉ nhờ điều chỉnh thuế.
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <label className="block text-sm font-semibold text-blue-800 mb-2">
            Số người phụ thuộc
          </label>
          <input
            type="number"
            min="0"
            value={dependentsStr}
            onChange={(e) => {
              const num = parseInt(e.target.value);
              setDependentsStr(isNaN(num) || num < 0 ? '0' : String(num));
            }}
            className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          />
        </div>

        <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col justify-center">
          <span className="text-sm font-semibold text-green-800">Giảm trừ gia cảnh mới (từ 1/7/2026)</span>
          <span className="text-xl font-bold text-green-600">
            {formatCurrency(NEW_CONFIG.personalDeduction)} / tháng
          </span>
        </div>

        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex flex-col justify-center">
          <span className="text-sm font-semibold text-purple-800">Người phụ thuộc mới (từ 1/7/2026)</span>
          <span className="text-xl font-bold text-purple-600">
            {formatCurrency(NEW_CONFIG.dependentDeduction)} / tháng
          </span>
        </div>
      </div>

      {/* Area chart: tax reduction */}
      <div>
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded-full bg-orange-500" />
          Mức tiền lương tăng thêm (Giảm thuế) theo Lương Gross
        </h3>
        <div className="h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
              <defs>
                <linearGradient id="colorReduc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="gross"
                label={{ value: 'Lương Gross (Triệu VNĐ)', position: 'insideBottom', offset: -15 }}
              />
              <YAxis
                label={{ value: 'Mức giảm (Triệu VNĐ)', angle: -90, position: 'insideLeft', offset: 10 }}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(2)} Triệu`, 'Mức tăng thực nhận']}
                labelFormatter={(label: number) => `Lương Gross: ${label} Triệu`}
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                }}
              />
              <ReferenceLine y={5} label="Mốc 5 Triệu" stroke="#ef4444" strokeDasharray="5 5" />
              <Area
                type="monotone"
                dataKey="reduction"
                stroke="#f97316"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorReduc)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line chart: old vs new tax */}
      <div>
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded-full bg-blue-500" />
          So sánh Tổng Thuế phải nộp (Cũ vs Mới)
        </h3>
        <div className="h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="gross" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(2)} Triệu`, '']}
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="oldTax"
                name="Thuế Cũ"
                stroke="#94a3b8"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="newTax"
                name="Thuế Mới 2026"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Notes */}
      <div className="p-5 bg-yellow-50 rounded-xl border border-yellow-200">
        <h4 className="font-bold text-yellow-800 mb-2">💡 Nhận xét:</h4>
        <ul className="list-disc ml-5 space-y-2 text-yellow-900 text-sm">
          <li>
            Dựa trên biểu đồ, để đạt mức tăng thực nhận <strong>5 triệu đồng</strong>, đường biểu diễn màu cam cần
            chạm mốc 5 trên trục Y.
          </li>
          <li>
            Với <strong>{dependents} người phụ thuộc</strong>,{' '}
            {insights.fiveMilestoneGross !== null ? (
              <>
                mốc này đạt được từ mức lương Gross khoảng{' '}
                <strong>{formatMillion(insights.fiveMilestoneGross)} triệu đồng</strong> trở lên.
              </>
            ) : (
              <>
                mức giảm <strong>chưa chạm mốc 5 triệu</strong> trong khoảng khảo sát 10 - 200 triệu đồng.
              </>
            )}{' '}
            Đường cong có những đoạn đi ngang: đó là các khoảng thu nhập mà biểu thuế cũ và biểu thuế mới cùng
            áp một thuế suất biên, nên khoảng cách giữa hai bên không đổi.
          </li>
          <li>
            Số người phụ thuộc gần như không dời được mốc 5 triệu — mỗi người phụ thuộc chỉ đẩy ngưỡng lên thêm
            khoảng <strong>0,8 triệu đồng</strong> lương Gross. Bù lại, mỗi người phụ thuộc nâng mức giảm tối đa
            thêm khoảng <strong>0,63 triệu đồng / tháng</strong>, vì phần giảm trừ người phụ thuộc tăng từ 4,4
            triệu lên 6,2 triệu và được trừ ở thuế suất cao nhất.
          </li>
          <li>
            Mức giảm tăng theo thu nhập nhưng <strong>có trần</strong>: khi cả hai biểu thuế cùng rơi vào bậc
            35%{insights.plateauGross !== null && (
              <> (từ khoảng <strong>{formatMillion(insights.plateauGross)} triệu đồng</strong> Gross)</>
            )}
            , mức giảm đứng yên ở <strong>{formatMillion(insights.maxReduction)} triệu đồng / tháng</strong>. Phần
            thu nhập vượt ngưỡng bị đánh cùng một thuế suất ở cả hai luật, nên chênh lệch chỉ còn đến từ giảm trừ
            gia cảnh và các mốc bậc thuế phía dưới.
          </li>
        </ul>
      </div>
    </div>
  );
};
