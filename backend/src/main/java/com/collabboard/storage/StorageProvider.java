package com.collabboard.storage;

import org.springframework.web.multipart.MultipartFile;

/**
 * Abstraction for object storage.
 * Implementations: MinIO (dev), Google Cloud Storage (prod).
 */
public interface StorageProvider {

    /**
     * Upload a multipart file.
     * @return the object key in storage
     */
    String upload(MultipartFile file, String folder);

    /**
     * Upload raw bytes.
     * @return the object key in storage
     */
    String uploadBytes(byte[] data, String key, String contentType);

    /**
     * Get a publicly accessible (or signed) URL for the object.
     */
    String getPresignedUrl(String key);

    /**
     * Delete an object.
     */
    void delete(String key);
}
