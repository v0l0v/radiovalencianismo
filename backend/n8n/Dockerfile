FROM n8nio/n8n:latest

USER root

# Install Python and pip (Debian based)
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

# Install mutagen for ID3 tagging
RUN pip3 install mutagen --break-system-packages

USER node
