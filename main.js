//parameters
var svg1 = d3.select('#graphDiv').append('svg')
              .attr('height','800px')
              .attr('width','1350px')
              .style('overflow','auto');

var selectArtistsList = [];
var displayedArtist = [];

// helper functions
function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function convertToRGB(list){
    result = 'rgb('
    list.forEach(function(d){
      result = result + d + ',';
    })
    result = result.substring(0,result.length-1) + ')';
    return result;
}

function rgbToHsl(r, g, b) {
  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;
  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [ h, s, l ];
}

function convertToHSL(list){
    result = 'hsl('
    var h = list[0]
    var s = list[1]+'%'
    // var l = list[2]+'%'
    var l = '50%';
    // result = result.substring(0,result.length-1) + '%)';
    return 'hsl(' + h + ',' + s + ',' + l + ')';
}

//load data
d3.queue()
  .defer(d3.json,"datasets/compress_color_artwork_final.json")
  .defer(d3.json,"datasets//moma_artist_hls.json")
  .defer(d3.json,"datasets/similar_vecs_final.json")
  .await(plot);
function plot(error,artworks,artists,recommends){

  if (error) throw error;
  console.log(artworks[0]);
  console.log(artists[1]);
  console.log(recommends[3]);

  var countByDepartment = d3.nest()
      .key(function(d){return d['Department']})
      .rollup(function(v){return v.length})
      .object(artworks);

  var departmentList = Object.keys(countByDepartment);

  var countByArtist = d3.nest()
      .key(function(d){return d['ConstituentID']}) //group data by artists
      .rollup(function(v){return v.length})
      .object(artworks);

  var nestByArtist = d3.nest()
      .key(function(d){return d['ConstituentID']}) //group data by artists
      .object(artists);
  // console.log(nestByArtist);

  let artistsNestById = d3.nest()
      .key(function(d){return d['ConstituentID']})
      .object(artists);

  var artworksNestbyId = d3.nest()
      .key(function(d){return d['ObjectID']})
      .object(artworks);

  var artistColor = {};
  const artistsList = Object.keys(countByArtist);

  for (const artist of artistsList){
      var color = getRandomColor();
      artistColor[artist] = color;
  }

  var nestedData = d3.nest()
      .key(function(d){return d['Department']}) //group data by department
      .key(function(e){return e['ConstituentID']}) //group data by artists
      .rollup(function(v){return v.length})
      .object(artworks);

  var div = d3.select('#graphDiv').append('div')
      .attr('id','departmentDiv');

  var barTooltipDiv = d3.select('body').append("div")
      .attr("class", "barTooltip")
      .style("left","0").style("top","0")
      .style("opacity", 0);

  var recTooltipDiv = d3.select('body').append("div")
      .attr("class", "recTooltipDiv")
      .style("left","0").style("top","0")
      .style("opacity", 0);

  const keys = Object.keys(nestedData);
  for (const key of keys){
      // key = departments here

      var data = nestedData[key];
      var total = countByDepartment[key];

      var wrapper = d3.select('#departmentDiv').append('div')
          .attr('class','wrapper')
          .attr('id','wrapper' + keys.indexOf(key));

      var departmentDesc = wrapper.append('div')
          .attr('class','departmentDesc')
          .html(key+' : '+countByDepartment[key] + ' items');

      var barWrapper = wrapper.append('div')
          .attr('class','bar_wrapper')
          .attr('id','bar_wrapper' + keys.indexOf(key));

      var bar = barWrapper.selectAll('.bar')
          .data(Object.keys(data)).enter().append('span')
          // .attr('class',function(d){return 'artist-'+d;}) //d = ConstituentID here
          .attr('class',function(d){return 'bar bar'+d;})
          // .attr('class','bar')
          .style('width',function(d){
              return data[d]/total*100+'%';
          })
          .style('background-color',function(d){

              var artistId = d.split(',')[0]
              // console.log(artistId)
              if (artistsNestById[artistId]){
                var repColor = artistsNestById[artistId][0]['Represent_color'];
              } else {
                var repColor = [255,255,255];
              }
              // console.log('???',repColor)
              // console.log(repColor);
              // var hsl = rgbToHsl(repColor[0],repColor[1],repColor[2]);
              // console.log(hsl);
              // var normalizeHSL = [hsl[0]*100,hsl[1],0.5];
              // console.log(normalizeHSL);
              // return convertToHSL(normalizeHSL);
              return convertToRGB(repColor);
          })
          .on('mouseover',function(d){
              barTooltipDiv.style('opacity',1);
              barTooltipDiv.html(function(){
                if (artistsNestById[d]){
                  return artistsNestById[d][0]['DisplayName'] + '</br>' + artistsNestById[d][0]['ArtistBio'] + '</br>' + nestedData[key][d] + ' items';
                } else {
                  return 'Known Artist';
              }})
          })
          .on('mousemove',function(d){
              barTooltipDiv.style("left", (d3.event.pageX) + 10 + "px")
              .style("top", (d3.event.pageY - 60) + "px");
          })
          .on('mouseout',function(d){
              barTooltipDiv.style('opacity',0);
          })
          .on('click',function(d){

              //Change style of selected bar
              if (selectArtistsList.indexOf(d) < 0){
                selectArtistsList.push(d);
                d3.selectAll('.bar'+d).classed('selected',true);

                var artistId = d.split(',')[0]
                if (artistsNestById[artistId]){
                  var repColor = artistsNestById[artistId][0]['Represent_color'];
                } else {
                  var repColor = [255,255,255];
                }
                var hsl = rgbToHsl(repColor[0],repColor[1],repColor[2]);

                //TODO: Add graphs for each artists
                d3.select('#selectedArtists').append('button')
                  .html(function(){
                      if(nestByArtist[d]){
                          return nestByArtist[d][0]['DisplayName'];
                      } else {
                          return "Unknown Artist";
                  }})
                  .attr('class','selectedArtist')
                  .style('background-color',function(){
                    return convertToRGB(repColor);
                  })
                  .style('color',function(){
                    // if (lightness > 0.5){return 'black';} else {return 'white';}
                    return 'white';
                  })
                  // .style('border',function(){
                  //   if (lightness > 0.5){return 'grey 0.5px solid';} else {return 'white 0.5px solid';}
                  // })
                  .on('click',function(){
                      var index = selectArtistsList.indexOf(d)
                      // console.log('???',d);
                      selectArtistsList.splice(index,1);
                      d3.select(this).remove();
                      // console.log('???',d3.selectAll('bar'+d));
                      d3.selectAll('.bar'+d).classed('selected',false);

                  });
              }

          })

  }

  // zoom
  var slider = document.getElementById("zoomRange");
  slider.oninput = function() {
    var zoomValue = this.value;
    d3.selectAll('.wrapper').style('width',100*zoomValue+'%');
  }

  d3.select('#plotThumbnail').on('click',generateThumbnail);

  //filter data based on selection
  function generateThumbnail(){

    foldDiv();

    // add filters
    var filtersDiv = d3.select('div#filtersDiv').style('display','block');
    d3.selectAll(".filterCheckbox").on("change",update);
    update();

    function update(){
      displayedArtist = [];
      d3.selectAll('.artistDiv').remove();

      var choices = [];
      d3.selectAll(".filterCheckbox").each(function(d){
        cb = d3.select(this);
        if(cb.property("checked")){
          choices.push(departmentList[cb.property("value")]);
        }
      });

      console.log("updating",choices);

      if(choices.length > 0){
        filteredArtworks = artworks.filter(function(d,i){return choices.includes(d['Department']);});
      } else {
        filteredArtworks = artworks;
      }

      var nestByArtistId = d3.nest()
          .key(function(d){return d['ConstituentID']})
          .object(filteredArtworks);

      console.log("selectArtistsList",selectArtistsList);

      if ((selectArtistsList.length != 0)&&(selectArtistsList!=displayedArtist)){
        plotSelected(selectArtistsList,nestByArtistId);
      }

    }

  }

  function updateThumbnail(){
    var filteredData = nestByArtistId;
    if ((selectArtistsList.length != 0)&&(selectArtistsList!=displayedArtist)){
      plotSelected(selectArtistsList,filteredData);
    }
  }

  function plotSelected(selectArtistsList,filteredData){
    // remove deselected artists
    console.log("displayedArtist",displayedArtist)
    for (const did in displayedArtist){
        if (selectArtistsList.indexOf(displayedArtist[did]) < 0){

          var divId = "#artistDiv"+displayedArtist[did];
          console.log(d3.select(divId));
          d3.select(divId).remove();
        }
    }
    // add newly selected artists
    for (const id of selectArtistsList){
        if (displayedArtist.indexOf(id) < 0){
          displayedArtist.push(id)
          // console.log('???',filteredData[id]);
          if (artistsNestById[id]&&filteredData[id]){
            var artistWrapper = d3.select('div#thumbnailDiv').append('div')
                .attr('class','artistDiv')
                .attr('id','artistDiv'+id)
                .attr('objectID',id);

            var artistInfo = artistsNestById[id][0];
            var artworksInfo = filteredData[id];

            var labelXPosition = 47;
            var sizeScaleRatio = 10;
            var artistDesc = artistWrapper.append('div')
                .attr('class','artistDesc')
                .html(artistInfo['DisplayName'] + '</br>' + artistInfo['ArtistBio']);

            function plotColorMatrix(){
              // the matrix of artists' artwork color representation
              var artistMatrix = artistDesc.append("svg")
                  .attr('class', 'artistMatrix');

              var birthyr = artistInfo['BeginDate']
              //
              // var matTooltipDiv = d3.select('body').append("div")
              //     .attr("class", "matTooltip")
              //     .style("opacity", 0);

              artistMatrix.selectAll('.artistBox')
                  .data(function(){
                      console.log(artworksInfo)
                      return artworksInfo
                  }).enter()
                  .append('rect')
                  .attr('class', 'artistBox')
                  .attr('x', function(d,i){return (i%14)*10;})
                  .attr('y', function(d,i){return (Math.round(i/14)*10);})
                  .attr('height', 10)
                  .attr('width', 10)
                  .attr('fill', function(d){return convertToRGB(d['Max Color']);})
                  // .attr('stroke', function(d){return convertToRGB(d['Max Color']);})
                  .on('mouseover',function(d,i){
                      // matTooltipDiv.style('opacity',1);
                      // matTooltipDiv.html(function (){
                      // return str(birthyr + i);})
                      //     .style("left", (d3.event.pageX) + 5 + "px")
                      //     .style("top", (d3.event.pageY - 50) + "px");
                  });
            }
            plotColorMatrix();
            // plotArtistGraph(artistInfo);
            var thumbnailLabelsSvg = artistWrapper.append('div')
                .attr('class','thumbnailLabels')
                .append('svg').attr('id','thumbnailabelsSvg');
            thumbnailLabelsSvg
                .append('text')
                .text('preview').attr('class','labels')
                .attr('text-anchor','end')
                .attr('x',labelXPosition+'px').attr('y','100px');
            thumbnailLabelsSvg
                .append('text')
                .text('size').attr('class','labels')
                .attr('text-anchor','end')
                .attr('x',labelXPosition+'px').attr('y','235px');
            thumbnailLabelsSvg
                .append('text')
                .text(sizeScaleRatio+'cm=1px').attr('class','labels')
                .attr('text-anchor','end')
                .attr('x',labelXPosition+'px').attr('y','250px');
            thumbnailLabelsSvg
                .append('text')
                .text('palette').attr('class','labels')
                .attr('text-anchor','end')
                .attr('x',labelXPosition+'px').attr('y','290px');

            var thumbnailWrapper = artistWrapper.append('div')
              .attr('class','thumbnailWrapper');

            var imageWrapper = thumbnailWrapper.selectAll('.image-wrapper')
              .data(artworksInfo).enter()
              .append('div')
              .attr('class','image-wrapper')
              .style('width','30px');

            var img = imageWrapper.append('img')
              .attr('src',function(d){
                  return d['ThumbnailURL'];
              })
              .attr('height','200px')
              .attr('width','auto')
              .attr('class','thumbnail')
              .attr('id',function(d){return 'thumbnail'+d['ObjectID'];});

            // console.log('img',img.node());
            // img_width = img.node().getBoundingClientRect();
            // console.log('img_width',img.node());

            imageWrapper.on('click',function(d){
                d3.selectAll('.artworkDetails').remove();
                d3.selectAll('.colorCodes').remove();
                d3.selectAll('.thumbnail').style('transform','translate(-50%,0)');
                // show artwork's details
                showArtworkDetails(d);

                d3.selectAll('.image-wrapper')
                  .style('width','30px')
                  .style('border-left','1px black solid')
                  .style('border-right','1px black solid');

                var svg = d3.select(this)
                  .transition()
                  .duration(1000)
                  .style('width',function(d){
                      if (d["Width (cm)"]/d["Height (cm)"]) {
                        return d["Width (cm)"]/d["Height (cm)"]*200+'px';
                      } else {
                        return '200px';
                      }
                  })
                  // .style('margin-left','0px')
                  // .style('margin-right','0px')
                  .style('border-left','black 20px solid')
                  .style('border-right','black 20px solid');

                  svg.select('img')
                  .style('transform','translate(0,0)');

                  d3.select(this).select('.artworkSizeRect')
                    .transition()
                    .duration(1000)
                    .attr('x',function(d){
                        if (d["Width (cm)"]/d["Height (cm)"]) {
                          return d["Width (cm)"]/d["Height (cm)"]*200/2 - d["Width (cm)"]/sizeScaleRatio/2;
                        } else {
                          return 100;
                        }
                    });

                  // plotDetails(d3.select(this));
                  plotColorAnalysis(d3.select(this).select('svg'));
              })

            var graphWrapper = imageWrapper.append('svg')
                .attr('class','graphWrapper');

            function plotColorAnalysis(graphWrapper){
                let foldedWidth = 28;
                let blockHeight = 20;
                let blockYPosition = 65;
                let blocksGap = 2;
                var colorCodes = graphWrapper.selectAll('.colorCodes')
                  .data(function(d){
                      return d['Domain color'];}).enter()
                  .append('rect')
                  .attr('class','colorCodes')
                  .attr('x',function(d,i){return d[2]*100 + '%';})
                  .attr('y',blockYPosition+'px')
                  .attr('height',blockHeight + 'px').attr('width',function(d,i){return d[1]*100 + '%';})
                  .attr('fill',function(d){
                      return convertToRGB(d[0]);
                  });
            }

            function plotSize(){
              // Plot artwork size graph
              let sizeYPosition = 40;
              let sizeScaleRatio = 10;
              graphWrapper.append('line')
                .attr('class','constructionLine')
                .attr('x1','0').attr('y1',sizeYPosition+'px')
                .attr('x2','100%').attr('y2',sizeYPosition+'px')
                .style('stroke','grey')
                .style('stroke-width','1px');

              graphWrapper.append('rect')
                .attr('class','artworkSizeRect')
                .attr('height',function(d){
                    if (d["Height (cm)"]) {
                      return d["Height (cm)"]/sizeScaleRatio;
                    } else {
                      return 1;
                    }
                })
                .attr('width',function(d){
                    if (d["Width (cm)"]){
                      return d["Width (cm)"]/sizeScaleRatio;
                    } else {
                      return 1;
                    }
                })
                .attr('x',function(d){
                  if (d["Width (cm)"]){
                    return 15-d["Width (cm)"]/sizeScaleRatio;
                  } else {
                    return 14.5;
                  }
                })
                .attr('y',function(d){
                  if (d["Height (cm)"]) {
                    return sizeYPosition-d["Height (cm)"]/10;
                  } else {
                    return sizeYPosition - 0.5;
                  }
                });
              }
            plotSize();

            function plotMaxAnalysis(){
                let foldedWidth = 28;
                let blockHeight = 20;
                let blockYPosition = 65;
                let blocksGap = 1;
                var colorMax = graphWrapper
                  .append('rect')
                  .attr('class','colorMax')
                  .attr('x',blocksGap + 'px')
                  .attr('y',blockYPosition+'px')
                  .attr('height',blockHeight + 'px').attr('width',foldedWidth+'px')
                  .attr('fill',function(d){
                      return convertToRGB(d['Max Color']);
                  });
            }
            plotMaxAnalysis();
          }
        }
    }
  }

  // add function to fold and expand graphDiv
  d3.select('#foldGraphDiv')
    .on('click',foldDiv);

  function foldDiv() {
    d3.selectAll('.wrapper')
      // .transition()
      //   .attr('duration',1000)
        .style('height','8px');
        // .style('margin','3px 0');
    d3.select('button#foldGraphDiv')
      .html('EXPAND')
      .on('click',expandDiv);
    d3.selectAll('.departmentDesc')
      .style('display','none');
  }

  function expandDiv() {
    d3.selectAll('.wrapper')
      .style('height','60px');
      d3.selectAll('.departmentDesc')
        .style('display','block');
    d3.select('button#foldGraphDiv')
      .html('FOLD')
      .on('click',foldDiv);
  }

  d3.select('#normalizeBar')
    .on('click',normalizeBarGraph);

  var maxCount = Math.max(...Object.values(countByDepartment));
  console.log(maxCount);

  function normalizeBarGraph() {

    for (const i in Object.keys(countByDepartment)){
      d3.select('#bar_wrapper'+i)
        .transition()
        .duration(1000)
        .style('width',function(){
            return Object.values(countByDepartment)[i]/maxCount*100+'%';
        });
    d3.select('#normalizeBar')
      .html('NORMALIZE BAR GRAPH')
      .on('click',cancelNormalize);
    }
  }

  function cancelNormalize() {
    d3.selectAll('.bar_wrapper')
      .transition()
      .duration(1000)
      .style('width','100%');
    d3.select('#normalizeBar')
      .html('DENORMALIZE BAR GRAPH')
      .on('click',normalizeBarGraph);
  }
  var artworkDetailDiv = d3.select('#selectedArtworks');
  artworkDetailDiv.append('p').html('SELECTED ARTWORKS:');
  artworkDetailDiv.append('p')
    .html("click on artwork's thumbnail to see details and recommendations")
    .attr('class','labels');

  var descDiv = artworkDetailDiv.append('div')
    .attr('class','artworkDesc');
  var descText = descDiv.append('p').attr('class','descriptions');

  var recommendationDiv = d3.select('#recommendation');
  recommendationDiv.append('p').html('SIMILAR ARTWORKS:');
  recommendationDiv.append('p')
    .html("similiar artworks are computed by extracting style features using an pre-trained VGG19 model")
    .attr('class','labels');
  var recommendWrapper = recommendationDiv.append('div').attr('id','recommend-wrapper');

  function showArtworkDetails(d){

      descText.html(function(){
          return d['Title'] + ' </br> ' + d['Date'] + ' </br></br> ' + d['Medium'] + '</br>';
      });
      descText.append('div').append('a').attr('href',function(){
          return d['URL']
      }).html(">>> go to artwork's webpage")
      .attr('class','link');

      d3.selectAll('.recommendImg').remove();
      var img = recommendWrapper.selectAll('.recommendImg')
        .data(recommends[d['ObjectID']]).enter()
        .append('img')
        .attr('src',function(d){
            if (artworksNestbyId[d]){
              return artworksNestbyId[d][0]['ThumbnailURL'];
            } else {
              console.log("couldn't find artworks id" + d);
            }
        })
        .attr('max-width','90%')
        .attr('height','100px')
        .attr('class','recommendImg')
        .classed('float_left',function(d,i){return (i/2 == Math.round(i/2));})
        .attr('id',function(d){return 'recommendImg'+d['ObjectID'];})
        .on('mouseover',function(d){
          recTooltipDiv.style('opacity',1);
          recTooltipDiv.html(function(){
              return '"' + artworksNestbyId[d][0]['Title'] + '" by ' + artworksNestbyId[d][0]['Artist'] + '</br>' + artworksNestbyId[d][0]['Date'];
          });
        })
        .on('mousemove',function(d){
            recTooltipDiv.style("left", (d3.event.pageX - 120) + "px")
            .style("top", (d3.event.pageY - 40) + "px");
        })
        .on('mouseout',function(d){
            recTooltipDiv.style('opacity',0).style('left','0px').style('top','0px');
        });
  }
}
