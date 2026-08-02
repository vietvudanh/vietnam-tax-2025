import React from 'react';
import { History, FileText, ExternalLink } from 'lucide-react';

type ChangeStatus = 'historical' | 'current';

interface LawChange {
  /** Ngày ban hành hoặc thông qua */
  issued: string;
  /** Thời điểm áp dụng thực tế */
  effective: string;
  document: string;
  title: string;
  status: ChangeStatus;
  highlights: string[];
  /** Mức giảm trừ gia cảnh áp dụng sau văn bản này (bản thân / người phụ thuộc) */
  deduction?: string;
  brackets?: string;
}

// Lịch sử thuế TNCN Việt Nam, xếp theo thời điểm áp dụng (mới nhất trước).
const CHANGES: LawChange[] = [
  {
    issued: '30/6/2026',
    effective: '1/7/2026',
    document: 'Nghị định 253/2026/NĐ-CP',
    title: 'Hướng dẫn chi tiết Luật Thuế TNCN 2025',
    status: 'current',
    highlights: [
      'Miễn thuế toàn bộ tiền lương làm thêm giờ, làm ban đêm (Điều 26)',
      'Nâng trần miễn thuế tiền ăn giữa ca, ăn trưa lên 1,2 triệu đồng/người/tháng',
      'Bổ sung giảm trừ chi phí y tế tối đa 23 triệu đồng/năm và giáo dục - đào tạo tối đa 24 triệu đồng/năm',
      'Nâng ngưỡng khấu trừ 10% thu nhập vãng lai từ 2 triệu lên 5 triệu đồng/lần (Điều 50)',
      'Thu nhập vãng lai bình quân dưới 15 triệu đồng/tháng không phải quyết toán (Điều 51)',
      'Bổ sung trường hợp con trên 18 tuổi được tính là người phụ thuộc (Điều 47)',
      'Ban hành bảng thuế suất trên doanh thu theo ngành nghề (0,5% - 5%)',
    ],
  },
  {
    issued: '2026',
    effective: '1/7/2026',
    document: 'Thông tư 87/2026/TT-BTC',
    title: 'Ngưỡng thu nhập xác định người phụ thuộc',
    status: 'current',
    highlights: [
      'Nâng mức thu nhập bình quân tháng của người phụ thuộc từ 1 triệu lên 3 triệu đồng',
    ],
  },
  {
    issued: '10/12/2025',
    effective: '1/7/2026 (thu nhập tiền lương áp dụng từ kỳ tính thuế 2026)',
    document: 'Luật Thuế thu nhập cá nhân 2025 (Luật 109/2025/QH15)',
    title: 'Luật Thuế TNCN mới thay thế Luật 2007',
    status: 'current',
    highlights: [
      'Biểu thuế lũy tiến giảm từ 7 bậc xuống 5 bậc: 5%, 10%, 20%, 30%, 35%',
      'Nâng ngưỡng doanh thu chịu thuế của hộ, cá nhân kinh doanh lên 1 tỷ đồng/năm',
      'Nâng ngưỡng tính thuế với trúng thưởng, bản quyền, nhượng quyền, thừa kế, quà tặng từ 10 lên 20 triệu đồng',
      'Bổ sung thu nhập chịu thuế mới: tài sản số, tín chỉ các-bon, biển số xe trúng đấu giá',
      'Mở rộng danh mục miễn thuế lên 24 khoản (nhân lực công nghệ cao, trái phiếu xanh, chứng chỉ quỹ mở nắm giữ trên 2 năm...)',
    ],
    brackets: '5 bậc (5% - 35%)',
  },
  {
    issued: '2025',
    effective: 'Kỳ tính thuế năm 2026',
    document: 'Nghị quyết 110/2025/UBTVQH15',
    title: 'Nâng mức giảm trừ gia cảnh',
    status: 'current',
    highlights: [
      'Giảm trừ bản thân: 11 triệu → 15,5 triệu đồng/tháng (186 triệu đồng/năm)',
      'Giảm trừ người phụ thuộc: 4,4 triệu → 6,2 triệu đồng/tháng',
    ],
    deduction: '15,5tr / 6,2tr',
  },
  {
    issued: '2/6/2020',
    effective: 'Kỳ tính thuế năm 2020',
    document: 'Nghị quyết 954/2020/UBTVQH14',
    title: 'Nâng mức giảm trừ gia cảnh',
    status: 'historical',
    highlights: [
      'Giảm trừ bản thân: 9 triệu → 11 triệu đồng/tháng',
      'Giảm trừ người phụ thuộc: 3,6 triệu → 4,4 triệu đồng/tháng',
    ],
    deduction: '11tr / 4,4tr',
  },
  {
    issued: '26/11/2014',
    effective: '1/1/2015',
    document: 'Luật 71/2014/QH13',
    title: 'Sửa đổi, bổ sung một số điều của các luật về thuế',
    status: 'historical',
    highlights: [
      'Cá nhân kinh doanh nộp thuế theo tỷ lệ % trên doanh thu, bỏ cách tính theo thu nhập thuần',
      'Bổ sung miễn thuế với thu nhập từ tiền lương của thuyền viên Việt Nam làm cho hãng tàu nước ngoài',
    ],
  },
  {
    issued: '15/8/2013',
    effective: '1/10/2013',
    document: 'Thông tư 111/2013/TT-BTC',
    title: 'Hướng dẫn thi hành Luật Thuế TNCN',
    status: 'historical',
    highlights: [
      'Hướng dẫn chi tiết cách xác định thu nhập chịu thuế, giảm trừ và khấu trừ thuế',
      'Khấu trừ 10% với thu nhập vãng lai từ 2 triệu đồng/lần (điểm i khoản 1 Điều 25)',
    ],
  },
  {
    issued: '22/11/2012',
    effective: '1/7/2013',
    document: 'Luật 26/2012/QH13',
    title: 'Sửa đổi, bổ sung Luật Thuế TNCN',
    status: 'historical',
    highlights: [
      'Giảm trừ bản thân: 4 triệu → 9 triệu đồng/tháng',
      'Giảm trừ người phụ thuộc: 1,6 triệu → 3,6 triệu đồng/tháng',
      'Bổ sung cơ chế điều chỉnh giảm trừ khi CPI biến động trên 20%',
    ],
    deduction: '9tr / 3,6tr',
  },
  {
    issued: '21/11/2007',
    effective: '1/1/2009',
    document: 'Luật Thuế thu nhập cá nhân 2007 (Luật 04/2007/QH12)',
    title: 'Luật Thuế TNCN đầu tiên của Việt Nam',
    status: 'historical',
    highlights: [
      'Thay thế Pháp lệnh thuế thu nhập đối với người có thu nhập cao',
      'Biểu thuế lũy tiến từng phần 7 bậc: 5%, 10%, 15%, 20%, 25%, 30%, 35%',
      'Giảm trừ bản thân 4 triệu đồng/tháng, người phụ thuộc 1,6 triệu đồng/tháng',
    ],
    deduction: '4tr / 1,6tr',
    brackets: '7 bậc (5% - 35%)',
  },
];

// Các văn bản liên quan về quản lý, kê khai - không thay đổi cách tính thuế.
const RELATED: { document: string; note: string }[] = [
  {
    document: 'Nghị định 293/2025/NĐ-CP',
    note: 'Mức lương tối thiểu vùng mới từ 1/1/2026, ảnh hưởng trần đóng bảo hiểm thất nghiệp',
  },
  {
    document: 'Quyết định 1109/QĐ-BTC năm 2026',
    note: 'Chuyển kê khai thuế TNCN tháng 4, 5, 6/2026 sang kê khai theo quý II/2026 (hạn nộp 31/7/2026)',
  },
  {
    document: 'Nghị định 245/2026/NĐ-CP',
    note: 'Gia hạn nộp thuế TNCN cho hộ, cá nhân kinh doanh từ 27/6/2026 đến 30/12/2026',
  },
];

const STATUS_LABEL: Record<ChangeStatus, { text: string; className: string }> = {
  current: { text: 'Đang áp dụng', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  historical: { text: 'Đã thay thế', className: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export const LawChangelog: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <History className="w-6 h-6 text-blue-600" />
          Lịch sử thay đổi luật thuế TNCN
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          Toàn bộ các mốc thay đổi chính của thuế thu nhập cá nhân Việt Nam, từ Luật đầu tiên năm 2007
          đến Nghị định 253/2026/NĐ-CP có hiệu lực 1/7/2026. Sắp xếp theo thời điểm áp dụng, mới nhất trước.
        </p>
      </div>

      <ol className="relative border-l-2 border-slate-200 ml-3 space-y-6">
        {CHANGES.map((change) => {
          const status = STATUS_LABEL[change.status];
          return (
            <li key={change.document} className="ml-6">
              <span
                className={`absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-white ${
                  change.status === 'current' ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              />
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Ban hành {change.issued}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{change.document}</h3>
                    <p className="text-sm text-slate-600">{change.title}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${status.className}`}>
                    {status.text}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs mb-3">
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
                    Áp dụng: {change.effective}
                  </span>
                  {change.deduction && (
                    <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-100">
                      Giảm trừ: {change.deduction}
                    </span>
                  )}
                  {change.brackets && (
                    <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full border border-orange-100">
                      Biểu thuế: {change.brackets}
                    </span>
                  )}
                </div>

                <ul className="space-y-1.5 text-sm text-slate-700">
                  {change.highlights.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-slate-300 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-1">Văn bản liên quan</h3>
        <p className="text-sm text-slate-500 mb-4">
          Không thay đổi cách tính thuế trên lương, nhưng ảnh hưởng đến kê khai và mức đóng bảo hiểm.
        </p>
        <ul className="space-y-3 text-sm">
          {RELATED.map((item) => (
            <li key={item.document} className="border-l-2 border-slate-200 pl-3">
              <div className="font-semibold text-slate-800">{item.document}</div>
              <div className="text-slate-600">{item.note}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <p className="text-xs text-amber-800">
          <strong>Lưu ý:</strong> Nội dung tổng hợp mang tính tham khảo. Vui lòng đối chiếu văn bản gốc trên
          {' '}
          <a
            href="https://vanban.chinhphu.vn/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline inline-flex items-center gap-1"
          >
            Cơ sở dữ liệu quốc gia về văn bản pháp luật
            <ExternalLink className="w-3 h-3" />
          </a>
          {' '}trước khi áp dụng.
        </p>
      </div>
    </div>
  );
};
