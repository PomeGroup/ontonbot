#!/bin/sh

# Start Minio server with custom address and console address in the background
minio server /data --address ":${MINIO_PORT}" --console-address ":${MINIO_DASHBOARD_PORT}" &
echo "Minio server started on port ${MINIO_PORT} and console on port ${MINIO_DASHBOARD_PORT}"
# Wait for Minio to start
sleep 15


# Initialize Minio client
mc alias set local ${MINIO_PUBLIC_URL} ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD}
echo "alias set local ${MINIO_PUBLIC_URL} ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD}"
#mc ls local
#mc mb --ignore-existing local/${MINIO_COLLECTION_BUCKET}
#mc mb --ignore-existing local/${MINIO_ITEM_BUCKET}
#mc mb --ignore-existing local/${MINIO_IMAGE_BUCKET}
#mc mb --ignore-existing local/${MINIO_VIDEO_BUCKET}
#mc mb --ignore-existing local/${MINIO_DOC_BUCKET}
#mc mb --ignore-existing local/${MINIO_DOC_DEFAULT_BUCKET}
#mc anonymous set download local/${MINIO_COLLECTION_BUCKET}
#mc anonymous set download local/${MINIO_ITEM_BUCKET}
#mc anonymous set download local/${MINIO_IMAGE_BUCKET}
#mc anonymous set download local/${MINIO_VIDEO_BUCKET}
#mc anonymous set download local/${MINIO_DOC_BUCKET}
#mc anonymous set download local/${MINIO_DOC_DEFAULT_BUCKET}
#mc policy set download local/${MINIO_SBT_COLLECTIONS_BUCKET}


