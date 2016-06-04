import {Injectable, NgZone} from '@angular/core';
import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';
import {MapsAPILoader} from './maps-api-loader/maps-api-loader';
import * as mapTypes from './bing-maps-types';
import {LazyMapsAPILoaderConfig} from './maps-api-loader/lazy-maps-api-loader';

/**
 * Wrapper class that handles the communication with the Bing Maps Javascript
 * API v8
 */
@Injectable()
export class BingMapsAPIWrapper {
  private _map: Promise<Microsoft.Maps.Map>;
  private _mapResolver: (value?: Microsoft.Maps.Map) => void;

  constructor(private _loader: MapsAPILoader, private _zone: NgZone, private _config: LazyMapsAPILoaderConfig) {
    this._map =
        new Promise<Microsoft.Maps.Map>((resolve: () => void) => { this._mapResolver = resolve; });
  }

  createMap(el: HTMLElement, mapOptions: mapTypes.MapOptions): Promise<void> {
    return this._loader.load().then(() => {
      // todo other options
      let map = new Microsoft.Maps.Map(el, {
        credentials: this._config.apiKey,
        center: new Microsoft.Maps.Location(mapOptions.center.lat, mapOptions.center.lng),
        zoom: mapOptions.zoom,
        mapTypeId: mapOptions.mapTypeId
      });
      this._mapResolver(map);
      return;
    });
  }

  setMapOptions(options: mapTypes.MapOptions) {
    this._map.then((m: Microsoft.Maps.Map) => {
      m.setOptions({
        center: new Microsoft.Maps.Location(options.center.lat, options.center.lng),
        zoom: options.zoom,
        mapTypeId: options.mapTypeId
      });
      // todo other options
    });
  }

  /**
   * Creates a Bing map marker with the map context
   */
  createMarker(options: mapTypes.MarkerOptions = <mapTypes.MarkerOptions>{}):
      Promise<mapTypes.Marker> {
    return this._map.then((map: Microsoft.Maps.Map) => {
      var loc = new Microsoft.Maps.Location(options.position.lat, options.position.lng);
      var pushpin = new Microsoft.Maps.Pushpin(loc);
      map.entities.push(pushpin);
      return new mapTypes.Marker(map, pushpin);
    });
  }

  createInfoWindow(options?: mapTypes.InfoWindowOptions): Promise<mapTypes.InfoWindow> {
    return this._map.then((map: Microsoft.Maps.Map) => {
      var infoBox = new Microsoft.Maps.Infobox(
        new Microsoft.Maps.Location(options.position.lat, options.position.lng),
        {
          visible: false,
          title: options.title,
          description: options.description,
          actions: options.actions
        });
      map.entities.push(infoBox);
      return new mapTypes.InfoWindow(map, infoBox);
    });
  }

  subscribeToMapEvent<E>(eventName: string): Observable<E> {
    return Observable.create((observer: Observer<E>) => {
      this._map.then((m: Microsoft.Maps.Map) => {
        Microsoft.Maps.Events.addHandler(m, eventName, (e: any) => {
          this._zone.run(() => observer.next(e));
        });
      });
    });
  }

  setCenter(latLng: mapTypes.LatLngLiteral): Promise<void> {
    return this._map.then((map: Microsoft.Maps.Map) => map.setOptions(
        { center: new Microsoft.Maps.Location(latLng.lat, latLng.lng) }
      ));
  }

  getZoom(): Promise<number> {
    return this._map.then((map: Microsoft.Maps.Map) => map.getZoom());
  }

  setZoom(zoom: number): Promise<void> {
    return this._map.then((map: Microsoft.Maps.Map) => map.setOptions({zoom: zoom}));
  }

  getCenter(): Promise<mapTypes.LatLngLiteral> {
    return this._map.then((map: Microsoft.Maps.Map) => {
      let center = map.getCenter();
      return {
        lat: center.latitude,
        lng: center.longitude
      };
    });
  }

  /**
   * Triggers the given event name on the map instance.
   */
  triggerMapEvent(eventName: string): Promise<void> {
    return this._map.then((m) => Microsoft.Maps.Events.invoke(m, eventName, null));
  }
}