FROM n8nio/n8n:latest

USER root

# Install Python and pip
RUN apk add --no-cache python3 py3-pip

# Install mutagen for ID3 tagging
RUN pip3 install --break-system-packages mutagen

USER node
