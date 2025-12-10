import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { ComparisonResult } from '../types';

interface ComparisonChartProps {
  data: ComparisonResult;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({ data }) => {
  const chartData = [
    {
      name: 'Thuế phải đóng (Tháng)',
      Old: data.oldReg.taxAmount,
      New: data.newReg.taxAmount,
    },
    {
      name: 'Thực lĩnh (Net)',
      Old: data.oldReg.netIncome,
      New: data.newReg.netIncome,
    }
  ];

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm">
          <p className="font-bold text-slate-700 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-600">{entry.name}:</span>
              <span className="font-semibold text-slate-800">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} />
          <YAxis tickFormatter={formatYAxis} tick={{fill: '#64748b', fontSize: 12}} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="Old" name="Quy định cũ" fill="#94a3b8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="New" name="Quy định mới" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};