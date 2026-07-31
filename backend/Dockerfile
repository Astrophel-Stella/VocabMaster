# VocabMaster Backend Dockerfile
# 多阶段构建，优化镜像大小

# 构建阶段
FROM python:3.10-slim as builder

WORKDIR /app

# 安装依赖（系统级，装到 /usr/local，全局可读）
# 用腾讯云内网 PyPI 镜像：容器内直连官方 pypi.org 在国内生产机上会超时
# （宿主机 ~/.pip/pip.conf 的镜像配置不会带进容器），故在此显式指定。
# 不用 --user：--user 装到 /root/.local，跨用户 COPY 后以 appuser 运行时
# Python user-site 按当前用户 HOME 解析，找不到该目录且无读权限，会 ModuleNotFound。
COPY requirements.txt .
RUN pip install --no-cache-dir \
    -i http://mirrors.tencentyun.com/pypi/simple \
    --trusted-host mirrors.tencentyun.com \
    -r requirements.txt

# 生产阶段
FROM python:3.10-slim

WORKDIR /app

# 从构建阶段复制系统级依赖（/usr/local 全局可读，任何用户都在 sys.path 上）
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# 复制应用代码
COPY . .

# 创建非 root 用户
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# 暴露端口
EXPOSE 8000

# 健康检查（用标准库 urllib，避免依赖未安装的 requests）
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# 启动命令：先幂等初始化/播种数据库（已有数据会跳过），再启动服务
CMD ["sh", "-c", "python init_db.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
