var Main;

import Map from "https://js.arcgis.com/5.1/@arcgis/core/Map.js";
import Graphic from "https://js.arcgis.com/5.1/@arcgis/core/Graphic.js";
import Point from "https://js.arcgis.com/5.1/@arcgis/core/geometry/Point.js";
import GraphicsLayer from "https://js.arcgis.com/5.1/@arcgis/core/layers/GraphicsLayer.js";
import ElevationLayer from "https://js.arcgis.com/5.1/@arcgis/core/layers/ElevationLayer.js";
import SceneView from "https://js.arcgis.com/5.1/@arcgis/core/views/SceneView.js";
import Search from "https://js.arcgis.com/5.1/@arcgis/core/widgets/Search.js";
import CustomSearchSource from "https://js.arcgis.com/5.1/@arcgis/core/widgets/Search/SearchSource.js";

Main = (function() {
    
    const layer = new ElevationLayer({
        url: "http://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
    });

    const map = new Map({
        basemap: "hybrid",
        ground: {
            layers: [layer]
        }
    });
    
    const view = new SceneView({
        container: "map",
        viewingMode: "global",
        map: map,
        camera: {
            position: {
                x: 30.3086,
                y: 59.9375,
                z: 20000000,
                spatialReference: {
                    wkid: 4326
                }
            },
            heading: 0,
            tilt: 0
        },
        popup: {
            dockEnabled: true,
            dockOptions: {
                breakpoint: false
            }
        },
        environment: {
            atmosphereEnabled: true,
            atmosphere: {
                quality: "low" 
            },
            lighting: {
                directShadowsEnabled: true, 
                date: new Date("July 15, 2026 12:00:00 UTC") 
            }
        }
    });
                
    const initMap = function() {
        const graphicsLayer = new GraphicsLayer();               
        map.add(graphicsLayer);

        for (const [key, value] of Object.entries(myStuff)) {                      
            console.log(key, value);
                        
            const point = {                        
                type: "point",                             
                x: value.coord[0],                        
                y: value.coord[1],                            
                z: 10000                          
            };
                                
            const markerSymbol = {                            
                type: "simple-marker",                             
                color: [252, 3, 244],                            
                outline: {                             
                    color: [255, 255, 255],                             
                    width: 1                            
                }          
            };
                                                
            const pointGraphic = new Graphic({                            
                geometry: point,                            
                symbol: markerSymbol,                            
                popupTemplate: {                                
                    title: value.city + ", " + value.state,
                    content: "Coordinates: " + value.coord[1] + ", " + value.coord[0]
                }                  
            });
                          
            graphicsLayer.add(pointGraphic);
        }
    };
                
    initMap();

    // Custom Search Source configuration
    const customSearchSource = new CustomSearchSource({
        placeholder: "Search city...",
        getSuggestions: (params) => {
            const searchTerm = (params.suggestTerm || "").toLowerCase().trim();
            if (!searchTerm) {
                return Promise.resolve([]);
            }

            const suggestions = [];
            for (const [key, value] of Object.entries(myStuff)) {
                const label = `${value.city}, ${value.state}`;
                if (
                    value.city.toLowerCase().includes(searchTerm) ||
                    label.toLowerCase().includes(searchTerm)
                ) {
                    suggestions.push({
                        key: key,
                        text: label,
                        sourceIndex: params.sourceIndex
                    });
                }
            }
            return Promise.resolve(suggestions);
        },
        getResults: (params) => {
            let selectedItem = null;

            // Handle selection from dropdown suggestions
            if (params.suggestResult && params.suggestResult.key) {
                selectedItem = myStuff[params.suggestResult.key];
            } 
            // Handle direct text submission (pressing Enter)
            else if (params.searchTerm) {
                const term = params.searchTerm.toLowerCase().trim();
                selectedItem = Object.values(myStuff).find(
                    (item) =>
                        item.city.toLowerCase() === term ||
                        `${item.city}, ${item.state}`.toLowerCase() === term
                );
            }

            if (!selectedItem) {
                return Promise.resolve([]);
            }

            const targetPoint = new Point({
                x: selectedItem.coord[0],
                y: selectedItem.coord[1],
                z: 10000,
                spatialReference: { wkid: 4326 }
            });

            const graphic = new Graphic({
                geometry: targetPoint,
                attributes: {
                    city: selectedItem.city,
                    state: selectedItem.state
                },
                popupTemplate: {
                    title: selectedItem.city + ", " + selectedItem.state,
                    content: "Coordinates: " + selectedItem.coord[1] + ", " + selectedItem.coord[0]
                }
            });

            const searchResult = {
                extent: null,
                feature: graphic,
                name: selectedItem.city + ", " + selectedItem.state
            };

            return Promise.resolve([searchResult]);
        }
    });

    const searchWidget = new Search({
        view: view,
        sources: [customSearchSource],
        includeDefaultSources: false,
        popupOpenOnSelect: true
    });

    // Zoom animation upon selecting a search result
    searchWidget.on("select-result", (event) => {
        if (event.result && event.result.feature) {
            view.goTo({
                target: event.result.feature.geometry,
                zoom: 12,
                tilt: 45
            }, {
                duration: 1500,
                easing: "ease-in-out"
            });
        }
    });

    view.ui.add(searchWidget, {
        position: "top-right"
    });

    view.on("click", (event) => {
        view.hitTest(event).then((response) => {
            if (response.results.length > 0) {
                const graphic = response.results[0].graphic;
                view.goTo({
                    target: graphic.geometry,
                    zoom: 12,
                    tilt: 45
                }, {
                    duration: 1500,
                    easing: "ease-in-out"
                });
            } else if (event.mapPoint) {
                view.goTo({
                    target: event.mapPoint,
                    zoom: 10
                }, {
                    duration: 1200
                });
            }
        });
    });
                
    return {};
})();