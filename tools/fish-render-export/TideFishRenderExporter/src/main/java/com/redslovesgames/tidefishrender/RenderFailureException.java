package com.redslovesgames.tidefishrender;

final class RenderFailureException extends RuntimeException {
    private final RenderFailureCode code;

    RenderFailureException(RenderFailureCode code, String message) {
        super(message);
        this.code = code;
    }

    RenderFailureException(RenderFailureCode code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    RenderFailureCode code() {
        return code;
    }
}
