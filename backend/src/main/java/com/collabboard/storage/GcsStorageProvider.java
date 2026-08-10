package com.collabboard.storage;

import com.google.cloud.storage.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.net.URL;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Google Cloud Storage implementation for production on GCP.
 * Active when profile 'gcp' is active.
 */
@Component
@Profile("gcp")
@Slf4j
public class GcsStorageProvider implements StorageProvider {

    private final Storage storage;
    private final String bucketName;

    public GcsStorageProvider(@Value("${gcs.bucket-name}") String bucketName) {
        this.storage = StorageOptions.getDefaultInstance().getService();
        this.bucketName = bucketName;
    }

    @Override
    public String upload(MultipartFile file, String folder) {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String key = folder + "/" + UUID.randomUUID() + extension;

        try {
            BlobInfo blobInfo = BlobInfo.newBuilder(bucketName, key)
                    .setContentType(file.getContentType())
                    .build();

            storage.createFrom(blobInfo, file.getInputStream());
        } catch (Exception e) {
            log.error("Failed to upload file to GCS: {}", e.getMessage(), e);
            throw new StorageException("Failed to upload file", e);
        }

        return key;
    }

    @Override
    public String uploadBytes(byte[] data, String key, String contentType) {
        try {
            BlobInfo blobInfo = BlobInfo.newBuilder(bucketName, key)
                    .setContentType(contentType)
                    .build();

            storage.create(blobInfo, data);
        } catch (Exception e) {
            log.error("Failed to upload bytes to GCS: {}", e.getMessage(), e);
            throw new StorageException("Failed to upload bytes", e);
        }
        return key;
    }

    @Override
    public String getPresignedUrl(String key) {
        try {
            BlobInfo blobInfo = BlobInfo.newBuilder(bucketName, key).build();
            URL url = storage.signUrl(blobInfo, 1, TimeUnit.HOURS,
                    Storage.SignUrlOption.withV4Signature());
            return url.toString();
        } catch (Exception e) {
            log.error("Failed to generate signed URL: {}", e.getMessage(), e);
            throw new StorageException("Failed to generate signed URL", e);
        }
    }

    @Override
    public void delete(String key) {
        try {
            storage.delete(bucketName, key);
        } catch (Exception e) {
            log.error("Failed to delete file from GCS: {}", e.getMessage(), e);
            throw new StorageException("Failed to delete file", e);
        }
    }
}
