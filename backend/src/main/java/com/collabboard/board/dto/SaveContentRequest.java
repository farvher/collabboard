package com.collabboard.board.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaveContentRequest {

    @NotNull(message = "Canvas data is required")
    private String canvasData;

    @NotNull(message = "Expected version is required")
    private Integer expectedVersion;
}
