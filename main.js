mapboxgl.accessToken = 'pk.eyJ1Ijoic3QwNjk0MTkiLCJhIjoiY2wwcDFuaDdsMG1jejNjbnRtZnBjc3NyMSJ9.J4bpyc2QxzlL33kjkuw0mg';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/st069419/cl191230t006915mu465t6xqw',
    center: [94.94062, 63.679533], // starting position [lng, lat]
    zoom: 2, // starting zoom
    //maxZoom: 10
  });

  document.addEventListener('DOMContentLoaded', function () {
    //https://docs.google.com/spreadsheets/d/1Lo7Vb62okilQMuWW7erDkG5qrXM7h57WM_UIRTBKrWY/edit?usp=sharing
    fetch('https://docs.google.com/spreadsheets/d/1Lo7Vb62okilQMuWW7erDkG5qrXM7h57WM_UIRTBKrWY/gviz/tq?tqx=out:csv&sheet=supermarket_yandex')  // for testing (latfield: 'lat', lonfield: 'lon')
        .then(response => response.text())
        .then(csvData => makemap(csvData))
    
    function makemap(csvData) {
        //console.log(csvData)

        csv2geojson.csv2geojson(csvData, {
                latfield: 'lat',
                lonfield: 'lon',
                delimiter: '.'
            }, function (err, data) {  // Callback after data loaded and transformed
                //console.log(data)
                map.addSource('electro', {
                    type: 'geojson',
                        data: data,
                        //объединяем точки в кластеры 
                        cluster: true,
                        //указываем радиус поиска кластера
                        clusterRadius:20

                })

                    map.addLayer({
                        'id':'electro-layer',
                        'source':'electro',
                        'type':'circle',
                        'paint':{
                            //цвет кружочка
                            'circle-color': '#77DD77',
                            //обводка толщина
                            'circle-stroke-width': 1,
                            //обводка цвет
                            'circle-stroke-color':'#FFFFFF',
                            //радиус точки (изменяемый - ступенчатый)
                            'circle-radius': [
                                //хотим установить шаги
                                'step',
                                //на основе слоя  point_count
                                //поле point_count появляется потому что мы используем кластеры
                                ['get','point_count'],
                                //размер 10, если количество точек меньше трех, 
                                5,
                                3,
                                //если больше то 20 
                                10,
                                //если больше 6 точек, То размер 30
                                6,
                                15
            
                                ]
                            }
                        })
                        //добавляем новый слой с подписями точек 
                        map.addLayer({
                            id:'cluster-count-labels',
                            type: 'symbol',
                            source: 'electro',
                            //подписи показываются только у тех объектов которых больше 1
                            //(подписи показываются только у тех объектов которые являются кластерами)
                            //с помощью фильтер: оставь только те значения у которых есть point_count
                            filter: ['has','point_count'],
                            //указываем что писать в ключе layout
                            layout: {
                                //указываем текстовое поле и что должно быть в нем 
                                'text-field': '{point_count_abbreviated}',
                                //указываем шрифт (DIN Off Pro Medium - классический шрифт)
                                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                                //размер шрифта
                                'text-size': 12
                            }
                        })

                        

                        //СОБЫТИЯ КОТОРЫЕ ПРОИСХОДЯТ ПО ЩЕЛЧКУ

                        //настройка клика по объекту
                        //если click выполняется в слое clusters,то выполняется функция
                        //функция на вход берет событие клика
                        map.on('click','electro-layer',function(e){
                        //console.log(e)
                        //функция которая принимает координаты на экране
                        var features = map.queryRenderedFeatures(e.point, {
                            layers:['electro-layer']
                            
                        })
                        //console.log(features)
                

                        if (!features[0].properties.cluster) {
                            var unclusteredFeature = features[0]
                            //console.log(unclusteredFeature)
                            //добавляем всплывающее окно
                            //document- вся наша страница
                            //document.getElementById - выбираем элемент с помощью идентификатора 
                            //document.getElementById('modal-inside') - пишем название идекнтификатора
                            document.getElementById('modal-inside').
                            //меняем внутренности элемента
                            //используем обратные кавычки (в которые встраиваем код)

                            innerHTML = `<h4>${unclusteredFeature.properties["Name"]}</h4>
                            Мощность:<h6>${unclusteredFeature.properties["Power"]}</h6>
                            Производительность:<h6>${unclusteredFeature.properties["Production"]}</h6>`
                            
                        
                        } else {
                        //какие исходные объекты входят в кластер
                        
                        //выбрали первый объект
                            var clusterid = features[0].properties.cluster_id
                        //выбрали точки количество 
                        var point_count = features[0].properties.point_count
                        //получаем источник данных
                        var clusterSource = map.getSource('electro')
                        //getClusterLeaves- функция (первый параметр что за точки, 
                        //второй - сколько точек, третий параметр это какие объекты мы хотим брать)
                        //четвертый параметр - callback фунцкия
                        //в скобках элементы функции, через стрелочку что должно происходить

                        clusterSource.getClusterLeaves(clusterid, point_count, 0, 
                            (error,clasteredFeatures) => {
                                console.log(clasteredFeatures)
                                //функция которая будет отчищать значения во всплывающем окне
                                document.getElementById('modal-inside'). innerHTML= ""
                                //для каждого элемента в clasteredFeatures
                                //forEach(feature => - функция которая применяется для каждой строчки
                                clasteredFeatures.forEach(feature => {
                                    //мы хотим чтобы эта команда применялась для каждого элемента
                                    document.getElementById('modal-inside').
                                    //меняем внутренности элемента
                                    //используем обратные кавычки (в которые встраиваем код)
                                    //необходимо чтобы эти значения добавлялись
                                
                                    innerHTML += `<h4>${feature.properties["Name"]}</h4>
                                    Производительность:<h6>${feature.properties["Production"]}</h6>
                                    Мощность:<h6>${feature.properties["Power"]}</h6>`

                                })
                        })
                    }

                    //используем объект (2)
                    modalInteractive.show()

                })
               

                //изменение мышки при наведение на объект
                //следим как мышка заходит на слой 
                //если она заходит должна срабатывать call-back фунция (то есть функция срабатывается только тогда,
                //если мышь зашла на нужный слой)
                map.on('mouseenter', 'electro-layer', function () {
                    //в нужном слое стиль курсора заменяется на такой
                    map.getCanvas().style.cursor = 'pointer';
                })

                //функция чтобы курсор изменялся после того, как мы покинули нужный слой
                map.on('mouseleave', 'electro-layer', function () {
                    //в остальном окне карты стиль курсора изменятся на обычный 
                    map.getCanvas().style.cursor = '';
                })


                //выбираем объект который является модальным окном (1)
                var modalInteractive = new bootstrap.Modal(document.getElementById('modal'))






            



            })
        }
    })
    
        
        
        
                /*map.on('load', function () {
                    // console.log(data)
                    map.addSource('vacancies', {
                        type: 'geojson',
                        data: data,
                        cluster: true,
                        clusterRadius: 20 // Radius of each cluster when clustering points (defaults to 50)
                    }); 
                })*/
  