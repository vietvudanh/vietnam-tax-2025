import React from 'react';
import { ArrowRight } from 'lucide-react';

export const BracketTable: React.FC = () => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-left text-slate-600">
        <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
          <tr>
            <th colSpan={2} className="px-4 py-3 text-center border-r border-slate-200 bg-slate-100">Quy định cũ (7 bậc)</th>
            <th colSpan={3} className="px-4 py-3 text-center bg-green-50 text-green-800">Quy định mới (5 bậc) - Từ 1/7/2026</th>
          </tr>
          <tr>
            <th className="px-4 py-2 border-r border-slate-200">Thu nhập tính thuế (Tr đ)</th>
            <th className="px-4 py-2 border-r border-slate-200">Thuế suất</th>
            <th className="px-4 py-2 border-r border-slate-200">Thu nhập tính thuế (Tr đ)</th>
            <th className="px-4 py-2 border-r border-slate-200">Thuế suất</th>
            <th className="px-4 py-2">Thay đổi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <tr className="hover:bg-slate-50">
            <td className="px-4 py-3 border-r border-slate-200">Đến 5</td>
            <td className="px-4 py-3 border-r border-slate-200 font-bold">5%</td>
            <td className="px-4 py-3 border-r border-slate-200 font-medium text-slate-900 bg-green-50/50">Đến 10</td>
            <td className="px-4 py-3 border-r border-slate-200 font-bold bg-green-50/50 text-green-700">5%</td>
            <td className="px-4 py-3 text-slate-500 italic">Nới rộng từ 5 triệu</td>
          </tr>
          <tr className="hover:bg-slate-50">
            <td className="px-4 py-3 border-r border-slate-200">Trên 5 đến 10</td>
            <td className="px-4 py-3 border-r border-slate-200 font-bold">10%</td>
            <td rowSpan={2} className="px-4 py-3 border-r border-slate-200 font-medium text-slate-900 align-middle bg-green-50/50">Trên 10 - 30</td>
            <td rowSpan={2} className="px-4 py-3 border-r border-slate-200 font-bold align-middle bg-green-50/50 text-green-700">10%</td>
            <td rowSpan={2} className="px-4 py-3 text-slate-500 italic align-middle">Giảm thuế suất</td>
          </tr>
          <tr className="hover:bg-slate-50">
            <td className="px-4 py-3 border-r border-slate-200">Trên 10 đến 18</td>
            <td className="px-4 py-3 border-r border-slate-200 font-bold">15%</td>
          </tr>
          <tr className="hover:bg-slate-50">
            <td className="px-4 py-3 border-r border-slate-200">Trên 18 đến 32</td>
            <td className="px-4 py-3 border-r border-slate-200 font-bold">20%</td>
            <td rowSpan={2} className="px-4 py-3 border-r border-slate-200 font-medium text-slate-900 align-middle bg-green-50/50">Trên 30 - 60</td>
            <td rowSpan={2} className="px-4 py-3 border-r border-slate-200 font-bold align-middle bg-green-50/50 text-green-700">20%</td>
            <td rowSpan={2} className="px-4 py-3 text-slate-500 italic align-middle">Giảm thuế suất</td>
          </tr>
          <tr className="hover:bg-slate-50">
            <td className="px-4 py-3 border-r border-slate-200">Trên 32 đến 52</td>
            <td className="px-4 py-3 border-r border-slate-200 font-bold">25%</td>
          </tr>
          <tr className="hover:bg-slate-50">
            <td className="px-4 py-3 border-r border-slate-200">Trên 52 đến 80</td>
            <td className="px-4 py-3 border-r border-slate-200 font-bold">30%</td>
            <td className="px-4 py-3 border-r border-slate-200 font-medium text-slate-900 bg-green-50/50">Trên 60 - 100</td>
            <td className="px-4 py-3 border-r border-slate-200 font-bold bg-green-50/50 text-green-700">30%</td>
            <td className="px-4 py-3 text-slate-500 italic">Ngưỡng mới</td>
          </tr>
          <tr className="hover:bg-slate-50">
            <td className="px-4 py-3 border-r border-slate-200">Trên 80</td>
            <td className="px-4 py-3 border-r border-slate-200 font-bold">35%</td>
            <td className="px-4 py-3 border-r border-slate-200 font-medium text-slate-900 bg-green-50/50">Trên 100</td>
            <td className="px-4 py-3 border-r border-slate-200 font-bold bg-green-50/50 text-green-700">35%</td>
            <td className="px-4 py-3 text-slate-500 italic">Tăng từ 80 triệu</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};