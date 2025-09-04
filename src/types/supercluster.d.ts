declare module 'supercluster' {
  export interface SuperclusterOptions {
    minZoom?: number;
    maxZoom?: number;
    radius?: number;
    extent?: number;
    nodeSize?: number;
    log?: boolean;
    map?: (props: unknown) => unknown;
    reduce?: (accumulated: unknown, props: unknown) => void;
  }

  export interface ClusterProperties {
    cluster: true;
    cluster_id: number;
    point_count: number;
    point_count_abbreviated: number;
  }

  export type PointFeature<P = unknown> = GeoJSON.Feature<GeoJSON.Point, P>;
  export type ClusterFeature<P = unknown> = GeoJSON.Feature<GeoJSON.Point, ClusterProperties & P> & { id?: number };

  export default class Supercluster<P = unknown, C = ClusterProperties> {
    constructor(options?: SuperclusterOptions);
    load(points: Array<PointFeature<P>>): this;
    getClusters(
      bbox: [number, number, number, number],
      zoom: number
    ): Array<ClusterFeature<C> | PointFeature<P>>;
    getChildren(clusterId: number): Array<ClusterFeature<C> | PointFeature<P>>;
    getLeaves(clusterId: number, limit?: number, offset?: number): Array<PointFeature<P>>;
    getTile(zoom: number, x: number, y: number): unknown;
    getClusterExpansionZoom(clusterId: number): number;
  }
}


