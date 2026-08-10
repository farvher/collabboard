package com.collabboard.storage;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Storage service that delegates to the active StorageProvider
 * (MinIO for dev, GCS for production on GCP).
 */
@Service
@RequiredArgsConstructor
public class StorageService {

    private final StorageProvider storageProvider;

    public String upload(MultipartFile file, String folder) {
        return storageProvider.upload(file, folder);
    }

    public String uploadBytes(byte[] data, String key, String contentType) {
        return storageProvider.uploadBytes(data, key, contentType);
    }

    public String getPresignedUrl(String key) {
        return storageProvider.getPresignedUrl(key);
    }

    public void delete(String key) {
        storageProvider.delete(key);
    }
}
