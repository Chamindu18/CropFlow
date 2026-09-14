package com.cropflow.marketplace.domain;

import org.springframework.http.HttpStatus;
import com.cropflow.common.exception.ApplicationException;

public class InvalidListingStateTransitionException extends ApplicationException {

    public InvalidListingStateTransitionException(
            ListingStatus currentStatus,
            ListingStatus targetStatus
    ) {
        super(
                "INVALID_LISTING_STATE_TRANSITION",
                String.format("Cannot transition listing from %s to %s", currentStatus, targetStatus),
                HttpStatus.CONFLICT
        );
    }
}