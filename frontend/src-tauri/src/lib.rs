// Tauri 应用初始化
// 注册 HTTP 插件：让前端通过原生请求直连 AI API，绕过浏览器 CORS 限制，
// 且 API 密钥不经过网页环境，更安全。
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
