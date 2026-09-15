type DecimalLike = {
  toFixed: (decimalPlaces?: number) => string;
};

export interface SimulationAssetDto {
  symbol: string;
  name: string;
  assetType: string;
  status: string;
  displayOrder: number;
  simulated: true;
}

export interface SimulationMarketSnapshotDto {
  scenarioKey: string;
  cycle: number;
  assetSymbol: string;
  price: string;
  occurredAt: string;
  simulated: true;
}

export interface SimulationAssetCatalogResponse {
  data: SimulationAssetDto[];
}

export interface SimulationMarketSnapshotResponse {
  data: SimulationMarketSnapshotDto[];
}

export interface SimulationAssetReadModel {
  symbol: string;
  name: string;
  assetType: string;
  status: string;
  displayOrder: number;
}

export interface SimulationSnapshotReadModel {
  cycle: number;
  price: DecimalLike;
  occurredAt: Date;
  asset: {
    symbol: string;
  };
}

export function toSimulationAssetDto(asset: SimulationAssetReadModel): SimulationAssetDto {
  return {
    symbol: asset.symbol,
    name: asset.name,
    assetType: asset.assetType,
    status: asset.status,
    displayOrder: asset.displayOrder,
    simulated: true,
  };
}

export function toSimulationMarketSnapshotDto(
  scenarioKey: string,
  snapshot: SimulationSnapshotReadModel,
): SimulationMarketSnapshotDto {
  return {
    scenarioKey,
    cycle: snapshot.cycle,
    assetSymbol: snapshot.asset.symbol,
    price: snapshot.price.toFixed(6),
    occurredAt: snapshot.occurredAt.toISOString(),
    simulated: true,
  };
}
