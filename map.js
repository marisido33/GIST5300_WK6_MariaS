var Main;


import Map from "https://js.arcgis.com/5.1/@arcgis/core/Map.js";
import Graphic from "https://js.arcgis.com/5.1/@arcgis/core/Graphic.js";
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

    
    const customSearchSource = new CustomSearchSource({
        placeholder: "Search city...",
        getSuggestions: (params) => {
            const matches = Object.values(myStuff).filter((item) =>
                item.city.toLowerCase().includes(params.suggestTerm.toLowerCase())
            );
            return Promise.resolve(
                matches.map((item) => ({
                    key: item.city,
                    text: item.city + ", " + item.state,
                    sourceIndex: params.sourceIndex
                }))
            );
        },
        getResults: (params) => {
            const match = Object.values(myStuff).find(
                (item) =>
                    item.city.toLowerCase() === params.suggestTerm.toLowerCase() ||
                    (item.city + ", " + item.state).toLowerCase() === params.suggestTerm.toLowerCase()
            );

            if (!match) return Promise.resolve([]);

            const targetPoint = {
                type: "point",
                x: match.coord[0],
                y: match.coord[1],
                spatialReference: { wkid: 4326 }
            };

            view.goTo(
                {
                    target: targetPoint,
                    zoom: 12,
                    tilt: 45
                },
                { duration: 1500 }
            );

            return Promise.resolve([
                {
                    extent: null,
                    feature: new Graphic({ geometry: targetPoint }),
                    name: match.city + ", " + match.state
                }
            ]);
        }
    });

    const searchWidget = new Search({
        view: view,
        sources: [customSearchSource],
        includeDefaultSources: false
    });

    view.ui.add(searchWidget, {
        position: "top-right"
    });

    
    view.on("click", (event) => {
        view.hitTest(event).then((response) => {
            if (response.results.length > 0) {
                // If user clicks directly on a graphic point:
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