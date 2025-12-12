import React from 'react';
import { formatCurrency } from '../utils/taxCalculator';
import { TrendingDown } from 'lucide-react';

interface ResultCardProps {
  title: string;
  netIncome: number;
  taxAmount: number;
  personalDeduction: number;
  dependentDeduction: number;
  isNew?: boolean;
  savings?: number;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  title,
  netIncome,
  taxAmount,
  personalDeduction,
  dependentDeduction,
  isNew = false,
  savings,
}) => {
  const cardClasses = isNew
    ? 'bg-white border-2 border-green-500 shadow-sm rounded-xl p-6 relative overflow-hidden'
    : 'bg-slate-100 border border-slate-200 rounded-xl p-6 relative overflow-hidden';

  const titleClasses = isNew
    ? 'absolute top-0 right-0 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-bl-lg'
    : 'absolute top-0 right-0 px-3 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded-bl-lg';

  const netIncomeClasses = isNew ? 'text-3xl font-bold text-emerald-600 mb-4' : 'text-3xl font-bold text-slate-700 mb-4';

  return (
    <div className={cardClasses}>
      <div className={titleClasses}>{title}</div>
      <div className="text-sm text-slate-500 mb-1">Thực lĩnh (Net)</div>
      <div className={netIncomeClasses}>{formatCurrency(netIncome)}</div>
      <div className="space-y-2 text-sm border-t border-slate-200 pt-3">
        <div className="flex justify-between text-slate-600">
          <span>Thuế phải đóng:</span>
          <span className="font-medium text-red-500">{formatCurrency(taxAmount)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Tổng giảm trừ:</span>
          <span className="font-medium">{formatCurrency(personalDeduction + dependentDeduction)}</span>
        </div>
      </div>
      {isNew && savings !== undefined && (
        <div className="mt-4 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-between border border-emerald-100">
          <span>Bạn tiết kiệm được:</span>
          <span className="text-lg flex items-center gap-1">
            {formatCurrency(savings)}
            <TrendingDown className="w-4 h-4" />
          </span>
        </div>
      )}
    </div>
  );
};
