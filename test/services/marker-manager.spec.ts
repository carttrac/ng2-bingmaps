import {describe, it, expect, beforeEachProviders, inject, async} from '@angular/core/testing';
import {provide, NgZone} from '@angular/core';

import {MarkerManager} from '../../src/services/marker-manager';
import {Marker} from '../../src/services/bing-maps-types';
import {BingMapsAPIWrapper} from '../../src/services/bing-maps-api-wrapper';
import {BingMapMarker} from '../../src/directives/bing-map-marker';

export function main() {
  describe('MarkerManager', () => {
    beforeEachProviders(() => [
      provide(NgZone, {useFactory: () => new NgZone({enableLongStackTrace: true})}),
      MarkerManager,
      BingMapMarker,
      provide(
          BingMapsAPIWrapper,
          {useValue: jasmine.createSpyObj('BingMapsAPIWrapper', ['createMarker'])})
    ]);

    describe('Create a new marker', () => {
      it('should call the mapsApiWrapper when creating a new marker',
         inject(
             [MarkerManager, BingMapsAPIWrapper],
             (markerManager: MarkerManager, apiWrapper: BingMapsAPIWrapper) => {
               const newMarker = new BingMapMarker(markerManager);
               newMarker.latitude = 34.4;
               newMarker.longitude = 22.3;
               newMarker.label = 'A';
               markerManager.addMarker(newMarker);

               expect(apiWrapper.createMarker)
                   .toHaveBeenCalledWith({position: {lat: 34.4, lng: 22.3}, label: 'A', draggable: false, icon: undefined});
             }));
    });

    describe('Delete a marker', () => {
      it('should set the map to null when deleting a existing marker',
         inject(
             [MarkerManager, BingMapsAPIWrapper],
             (markerManager: MarkerManager, apiWrapper: BingMapsAPIWrapper) => {
               const newMarker = new BingMapMarker(markerManager);
               newMarker.latitude = 34.4;
               newMarker.longitude = 22.3;
               newMarker.label = 'A';

               const markerInstance: Marker = jasmine.createSpyObj('Marker', ['setMap']);
               (<any>apiWrapper.createMarker).and.returnValue(Promise.resolve(markerInstance));

               markerManager.addMarker(newMarker);
               markerManager.deleteMarker(newMarker)
                   .then(() => { expect(markerInstance.setMap).toHaveBeenCalledWith(null); });
             }));
    });

    describe('set marker icon', () => {
      it('should update that marker via setIcon method when the markerUrl changes',
        async(inject(
              [MarkerManager, BingMapsAPIWrapper],
              (markerManager: MarkerManager, apiWrapper: BingMapsAPIWrapper) => {
                const newMarker = new BingMapMarker(markerManager);
                newMarker.latitude = 34.4;
                newMarker.longitude = 22.3;
                newMarker.label = 'A';

                const markerInstance: Marker = jasmine.createSpyObj('Marker', ['setMap', 'setIcon']);
                (<any>apiWrapper.createMarker).and.returnValue(Promise.resolve(markerInstance));

                markerManager.addMarker(newMarker);
                expect(apiWrapper.createMarker)
                    .toHaveBeenCalledWith({position: {lat: 34.4, lng: 22.3}, label: 'A', draggable: false, icon: undefined});
                const iconUrl = 'http://angular-maps.com/icon.png';
                newMarker.iconUrl = iconUrl;
                return markerManager.updateIcon(newMarker).then(() => {
                  expect(markerInstance.setIcon).toHaveBeenCalledWith(iconUrl);
                });
              })));
    });
  });
}