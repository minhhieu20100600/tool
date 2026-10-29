Hướng dẫn cách dùng:
Sau khi đã cài đặt thành công. KHi vào làm bài ấn tổ hợp phím ALT+S để kích hoạt tool, ấn tổ hợp phím ALT+X để tắt tool

Cách thức tool hoạt động:
Bắt sự kiện bàn phím (Event Interception):

Script gắn một hàm lắng nghe sự kiện (EventListener) vào sự kiện keydown của trình duyệt.

Mỗi khi bạn nhấn bất kỳ một phím vật lý nào trên bàn phím, script sẽ lập tức chặn sự kiện gõ phím thực tế đó lại bằng lệnh preventDefault().

Bắn tín hiệu phím chuẩn (Event Injection & State Tracking):

Script duy trì một biến con trỏ (typedIndex) để theo dõi chính xác vị trí phím Romaji cần nhập tiếp theo.

Thay vì ký tự bạn vừa bấm, script tự tạo và phát ra chuỗi sự kiện bàn phím giả lập (keydown, keypress, keyup) chứa đúng ký tự Romaji tại vị trí typedIndex.

Sau khi bắn tín hiệu thành công, biến typedIndex tự động tăng lên 1 đơn vị để sẵn sàng cho phím kế tiếp. Khi trang web chuyển sang câu Kana mới, typedIndex tự động reset về 0.