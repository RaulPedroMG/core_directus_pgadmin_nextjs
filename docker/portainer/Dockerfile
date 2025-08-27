FROM portainer/portainer-ce:latest

# Create init script that sets up admin password
RUN echo '#!/bin/sh' > /init-portainer.sh && \
    echo 'echo "Initializing Portainer..."' >> /init-portainer.sh && \
    echo 'echo "admin" > /tmp/portainer_password' >> /init-portainer.sh && \
    echo 'echo "Starting Portainer..."' >> /init-portainer.sh && \
    echo 'exec /portainer "$@"' >> /init-portainer.sh && \
    chmod +x /init-portainer.sh

ENTRYPOINT ["/init-portainer.sh"]
CMD ["--admin-password-file", "/tmp/portainer_password"]
