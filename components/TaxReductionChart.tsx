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

const INSURANCE_RATE = 0.105; // 8% BHXH + 1.5% BHYT + 1% BHTN
const MAX_INSURANCE_SALARY = 36_000_000;

const OLD_SELF_DEDUCTION = 11_000_000;
const OLD_DEPENDENT_DEDUCTION = 4_400_000;

const NEW_SELF_DEDUCTION = 15_000_000;
const NEW_DEPENDENT_DEDUCTION = 6_000_000;

const OLD_TAX_BRACKETS = [
  { limit: 5_000_000, rate: 0.05 },
  { limit: 10_000_000, rate: 0.10 },
  { limit: 18_000_000, rate: 0.15 },
  { limit: 32_000_000, rate: 0.20 },
  { limit: 52_000_000, rate: 0.25 },
  { limit: 80_000_000, rate: 0.30 },
  { limit: Infinity, rate: 0.35 },
];

const NEW_TAX_BRACKETS = [
  { limit: 10_000_000, rate: 0.05 },
  { limit: 20_000_000, rate: 0.10 },
  { limit: 35_000_000, rate: 0.15 },
  { limit: 55_000_000, rate: 0.20 },
  { limit: 85_000_000, rate: 0.25 },
  { limit: 120_000_000, rate: 0.30 },
  { limit: Infinity, rate: 0.35 },
];

const calculateTax = (
  taxableIncome: number,
  brackets: { limit: number; rate: number }[]
): number => {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  let prevLimit = 0;
  for (const bracket of brackets) {
    if (taxableIncome > prevLimit) {
      const currentTaxable = Math.min(taxableIncome, bracket.limit) - prevLimit;
      tax += currentTaxable * bracket.rate;
      prevLimit = bracket.limit;
    } else {
      break;
    }
  }
  return tax;
};

export const TaxReductionChart: React.FC = () => {
  const [dependents, setDependents] = useState(0);

  const data = useMemo(() => {
    const chartData = [];
    for (let gross = 10_000_000; gross <= 200_000_000; gross += 5_000_000) {
      const insurance =
        Math.min(gross, MAX_INSURANCE_SALARY) * INSURANCE_RATE;
      const incomeAfterInsurance = gross - insurance;

      const oldTaxable = Math.max(
        0,
        incomeAfterInsurance -
          OLD_SELF_DEDUCTION -
          dependents * OLD_DEPENDENT_DEDUCTION
      );
      const oldTax = calculateTax(oldTaxable, OLD_TAX_BRACKETS);

      const newTaxable = Math.max(
        0,
        incomeAfterInsurance -
          NEW_SELF_DEDUCTION -
          dependents * NEW_DEPENDENT_DEDUCTION
      );
      const newTax = calculateTax(newTaxable, NEW_TAX_BRACKETS);

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">
          So sánh Mức Giảm Thuế TNCN (Dự kiến 2026)
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
            value={dependents}
            onChange={(e) => setDependents(parseInt(e.target.value) || 0)}
            className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          />
        </div>

        <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col justify-center">
          <span className="text-sm font-semibold text-green-800">Giảm trừ gia cảnh mới (giả định)</span>
          <span className="text-xl font-bold text-green-600">15.000.000đ / tháng</span>
        </div>

        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex flex-col justify-center">
          <span className="text-sm font-semibold text-purple-800">Người phụ thuộc mới (giả định)</span>
          <span className="text-xl font-bold text-purple-600">6.000.000đ / tháng</span>
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
            Với <strong>0 người phụ thuộc</strong>, mức lương Gross thường phải nằm trong khoảng{' '}
            <strong>110 - 120 triệu đồng</strong> để nhận được ưu đãi này do các bậc thuế cao được nới rộng.
          </li>
          <li>
            Nếu bạn có nhiều người phụ thuộc, mức lương Gross cần thiết sẽ <strong>cao hơn nữa</strong> để có thể
            &quot;tiết kiệm&quot; được tới 5 triệu tiền thuế, vì phần thuế phải nộp ban đầu của bạn vốn đã thấp hơn
            người độc thân.
          </li>
          <li>
            Mức giảm thuế lớn nhất nằm ở các nhóm thu nhập cao do họ đang chịu thuế suất 30-35%. Khi nới rộng bậc
            thuế, phần thu nhập bị đánh thuế cao giảm xuống đáng kể.
          </li>
        </ul>
      </div>
    </div>
  );
};
