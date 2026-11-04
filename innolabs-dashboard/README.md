# InnoLabs Ads Spend Dashboard

Trang HTML gốc đã được tách thành React components, sử dụng Tailwind CSS và TypeScript.

## Chạy project

```bash
npm install
npm run dev
```

Sau khi chạy, mở địa chỉ Vite hiển thị (thường là `http://localhost:5173`). Không mở trực tiếp file `index.html` bằng `file://`.

## Cấu trúc chính

- `src/layouts/DashboardLayout.tsx`: layout dùng chung cho toàn bộ dashboard.
- `src/components/layout`: top navbar và sidebar.
- `src/components/ui`: component UI tái sử dụng như card và toggle.
- `src/components/config`: từng module riêng của trang Config.
- `src/components/dashboard`: bộ lọc, KPI, biểu đồ, phân bổ Brand và bảng Ad Account.
- `src/components/resource-flow`: bộ lọc và bảng chi tiết dòng tiền của trang Reports.
- `src/components/deposit`: số dư, form nạp tiền và lịch sử giao dịch.

## Trang có sẵn

- `/`: Dashboard tổng quan.
- `/reports`: Chi tiết dòng tiền quảng cáo.
- `/accounts`: Nạp tiền và lịch sử giao dịch.
- `/config`: Cấu hình hệ thống.
- `src/data`: menu và mock data, sau này thay bằng dữ liệu API.
- `src/types`: interface TypeScript dùng chung.
- `src/pages`: các trang nghiệp vụ.

Khi thêm trang mới, giữ nguyên `DashboardLayout` và chỉ thay component trong `src/pages`.
