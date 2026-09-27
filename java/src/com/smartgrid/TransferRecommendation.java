package com.smartgrid;

/**
 * Encapsulates a simulated load transfer recommendation from an overloaded
 * zone to an adjacent zone with spare capacity.
 *
 * NOTE: This is an educational simulation calculation and does NOT
 * command live physical electrical switches.
 */
public class TransferRecommendation {
    private final String sourceZoneId;
    private final String sourceZoneName;
    private final String targetZoneId;
    private final String targetZoneName;
    private final double transferMw;
    private final double sourcePreLoadMw;
    private final double sourcePostLoadMw;
    private final double targetPreLoadMw;
    private final double targetPostLoadMw;
    private final double sourceCapacityMw;
    private final double targetCapacityMw;
    private final double sourcePreOverloadMw;
    private final double targetPreSpareMw;
    private final double lineCapacityMw;
    private final String reason;
    private final String transferType; // INTRA_PARTITION or INTER_PARTITION

    public TransferRecommendation(String sourceZoneId, String sourceZoneName,
                                  String targetZoneId, String targetZoneName,
                                  double transferMw,
                                  double sourcePreLoadMw, double sourcePostLoadMw,
                                  double targetPreLoadMw, double targetPostLoadMw,
                                  double sourceCapacityMw, double targetCapacityMw,
                                  double sourcePreOverloadMw, double targetPreSpareMw,
                                  double lineCapacityMw,
                                  String reason, String transferType) {
        this.sourceZoneId = sourceZoneId;
        this.sourceZoneName = sourceZoneName;
        this.targetZoneId = targetZoneId;
        this.targetZoneName = targetZoneName;
        this.transferMw = Math.round(transferMw * 100.0) / 100.0;
        this.sourcePreLoadMw = Math.round(sourcePreLoadMw * 100.0) / 100.0;
        this.sourcePostLoadMw = Math.round(sourcePostLoadMw * 100.0) / 100.0;
        this.targetPreLoadMw = Math.round(targetPreLoadMw * 100.0) / 100.0;
        this.targetPostLoadMw = Math.round(targetPostLoadMw * 100.0) / 100.0;
        this.sourceCapacityMw = sourceCapacityMw;
        this.targetCapacityMw = targetCapacityMw;
        this.sourcePreOverloadMw = Math.round(sourcePreOverloadMw * 100.0) / 100.0;
        this.targetPreSpareMw = Math.round(targetPreSpareMw * 100.0) / 100.0;
        this.lineCapacityMw = lineCapacityMw;
        this.reason = reason;
        this.transferType = transferType;
    }

    public String getSourceZoneId() { return sourceZoneId; }
    public String getSourceZoneName() { return sourceZoneName; }
    public String getTargetZoneId() { return targetZoneId; }
    public String getTargetZoneName() { return targetZoneName; }
    public double getTransferMw() { return transferMw; }
    public double getSourcePreLoadMw() { return sourcePreLoadMw; }
    public double getSourcePostLoadMw() { return sourcePostLoadMw; }
    public double getTargetPreLoadMw() { return targetPreLoadMw; }
    public double getTargetPostLoadMw() { return targetPostLoadMw; }
    public double getSourceCapacityMw() { return sourceCapacityMw; }
    public double getTargetCapacityMw() { return targetCapacityMw; }
    public double getSourcePreOverloadMw() { return sourcePreOverloadMw; }
    public double getTargetPreSpareMw() { return targetPreSpareMw; }
    public double getLineCapacityMw() { return lineCapacityMw; }
    public String getReason() { return reason; }
    public String getTransferType() { return transferType; }

    public double getSourcePostUtilization() {
        return (sourcePostLoadMw / sourceCapacityMw) * 100.0;
    }

    public double getTargetPostUtilization() {
        return (targetPostLoadMw / targetCapacityMw) * 100.0;
    }

    @Override
    public String toString() {
        return String.format("TransferRecommendation[%s -> %s: %.2f MW (%s), Pre: %s=%.1f MW, Post: %s=%.1f MW, Reason=%s]",
                sourceZoneName, targetZoneName, transferMw, transferType,
                sourceZoneName, sourcePreLoadMw, sourceZoneName, sourcePostLoadMw, reason);
    }
}
