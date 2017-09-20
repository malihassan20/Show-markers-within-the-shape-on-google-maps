
var map;
var drawingManager;
var circle=[];
var rectangle=[];
var polygon=[];
var pins1=[];
var pins2=[];
var markers1=[];
var markers2=[];
var circleCount=0;
var rectangleCount=0;
var polygonCount=0;
var X = XLSX;
var isFile1Selected=0,isFile2Selected=0;
var marker,infowindow,point;

function initMap() 
{
    map = new google.maps.Map(document.getElementById('map-canvas'), {
        center: {lat: 45.5, lng: -73.583333},
        zoom: 8
    });

    drawingManager = new google.maps.drawing.DrawingManager({
        drawingControl: true,
        drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
            google.maps.drawing.OverlayType.CIRCLE,
            google.maps.drawing.OverlayType.POLYGON,
            google.maps.drawing.OverlayType.RECTANGLE
        ]
        },
        circleOptions: {
            editable: true
        }
    });
    drawingManager.setMap(map);
    google.maps.event.addListener(drawingManager, 'overlaycomplete', function(shape) 
    {
        if (shape.type == google.maps.drawing.OverlayType.CIRCLE) {
            circle.push(shape);
            
            circleCount++;
        }
        else if (shape.type == google.maps.drawing.OverlayType.POLYGON) {
            polygon.push(shape);
            polygonCount++;
        }
        else if (shape.type == google.maps.drawing.OverlayType.RECTANGLE) {
            rectangle.push(shape);
            rectangleCount++;
        }
    });
        
}
google.maps.event.addDomListener(window, 'load', initMap);

google.maps.Polygon.prototype.Contains = function (point) 
{
    var crossings = 0,
        path = this.getPath();

    // for each edge
    for (var i = 0; i < path.getLength(); i++) {
        var a = path.getAt(i),
            j = i + 1;
        if (j >= path.getLength()) {
            j = 0;
        }
        var b = path.getAt(j);
        if (rayCrossesSegment(point, a, b)) {
            crossings++;
        }
    }

    // odd number of crossings?
    return (crossings % 2 == 1);

    function rayCrossesSegment(point, a, b) {
        var px = point.lng(),
            py = point.lat(),
            ax = a.lng(),
            ay = a.lat(),
            bx = b.lng(),
            by = b.lat();
        if (ay > by) {
            ax = b.lng();
            ay = b.lat();
            bx = a.lng();
            by = a.lat();
        }
        // alter longitude to cater for 180 degree crossings
        if (px < 0) {
            px += 360
        };
        if (ax < 0) {
            ax += 360
        };
        if (bx < 0) {
            bx += 360
        };

        if (py == ay || py == by) py += 0.00000001;
        if ((py > by || py < ay) || (px > Math.max(ax, bx))) return false;
        if (px < Math.min(ax, bx)) return true;

        var red = (ax != bx) ? ((by - ay) / (bx - ax)) : Infinity;
        var blue = (ax != px) ? ((py - ay) / (px - ax)) : Infinity;
        return (blue >= red);

    }

};
        
function process_wb1(wb) 
{
    var output = to_csv(wb);
    var temp=output.toString().split(',');
    for(var i=3;i<temp.length;i+=3)
        pins1.push({ 'id': temp[i], 'latitude': temp[i+1],'longitude':temp[i+2]});
}
function process_wb2(wb) 
{
    var output = to_csv(wb);
    var temp=output.toString().split(',');
    for(var i=3;i<temp.length;i+=3)
        pins2.push({ 'id': temp[i], 'latitude': temp[i+1],'longitude':temp[i+2]});
}
function to_csv(workbook) 
{
    var result = [];
    workbook.SheetNames.forEach(function(sheetName) {
        var csv = X.utils.sheet_to_csv(workbook.Sheets[sheetName]);
        if(csv.length > 0)
        {
            result.push(csv);
        }
    });
    return result.join("\n");
}
function fixdata(data) 
{
    var o = "", l = 0, w = 10240;
    for(; l<data.byteLength/w; ++l) o+=String.fromCharCode.apply(null,new Uint8Array(data.slice(l*w,l*w+w)));
    o+=String.fromCharCode.apply(null, new Uint8Array(data.slice(l*w)));
    return o;
}

function handleFile1(e)
{
    var files = document.getElementById('file1').files;
    var f = files[0];
    {
        var reader = new FileReader();
        reader.onload = function(e) 
        {
            var data = e.target.result;
            var wb;
            var arr = fixdata(data);
            wb = X.read(btoa(arr), {type: 'base64'});
            process_wb1(wb);
        };
        reader.readAsArrayBuffer(f);
    }
    isFile1Selected=1;
}
function handleFile2(e)
{
    var files = document.getElementById('file2').files;
    var f = files[0];
    {
        var reader = new FileReader();
        reader.onload = function(e) 
        {
            var data = e.target.result;
            var wb;
            var arr = fixdata(data);
            wb = X.read(btoa(arr), {type: 'base64'});
            process_wb2(wb);
        };
        reader.readAsArrayBuffer(f);
    }
    isFile2Selected=1;
}

function showPins1(t)
{
    if (t.is(':checked')) 
    {
        if(isFile1Selected==0)
            alert("Please select excel file first!");
        
            if(polygon.length>0)
            {
                var heading='<h2>From Sheet 1</h2>';
                $("#polygon1").append(heading);
                for(var j=0;j<polygon.length;j++)
                {
                    var heading='<h3>Polygon # '+j+'</h3>';
                    $("#polygon1").append(heading);
                    var html = '<table class="table table-bordered">';
                    html += '<thead><tr><th>ID</th><th>Latitude</th><th>Longitude</th></tr></thead><tbody>';
                        
                    for(var i=1;i<pins1.length-1;i++)
                    {
                        point = new google.maps.LatLng(pins1[i].latitude, pins1[i].longitude);
                       
                        if(polygon[j].overlay.Contains(point))
                        {
                            html += '<tr><td>' + pins1[i].id + '</td><td>'+pins1[i].latitude+'</td><td>'+pins1[i].longitude+'</td></tr>';
                            var t='ID : '+pins1[i].id +'<br>Latitude : '+pins1[i].latitude+'<br>Longitude : '+pins1[i].longitude;
                            marker = new google.maps.Marker({
                            position: point,
                            map: map,
                            html:t
                            });
                            infowindow=new google.maps.InfoWindow({
                                content: t
                            });
                            google.maps.event.addListener(marker, 'click', function() {
                                 infowindow.setContent(this.html);
                                    infowindow.open(map, this);
                            });
                            markers1.push(marker);
                        }
                    }
                    html += '</tbody></table>';
                    $("#polygon1").append(html);
                }
            }
            
            if(circle.length>0)
            {
                var heading='<h2>From Sheet 1</h2>';
                $("#circle1").append(heading);
                for(var j=0;j<circle.length;j++)
                {
                    var heading='<h3>Circle # '+j+'</h3>';
                     $("#circle1").append(heading);
                    var html = '<table class="table table-bordered">';
                    html += '<thead><tr><th>ID</th><th>Latitude</th><th>Longitude</th></tr></thead><tbody>';
                     for(var i=1;i<pins1.length-1;i++)
                     {
                        point = new google.maps.LatLng(pins1[i].latitude, pins1[i].longitude);
                        
                        if(google.maps.geometry.spherical.computeDistanceBetween(point, (circle[j].overlay.getCenter())) <= (circle[j].overlay.getRadius()))
                        {
                            html += '<tr><td>' + pins1[i].id + '</td><td>'+pins1[i].latitude+'</td><td>'+pins1[i].longitude+'</td></tr>';
                            var t1='ID : '+pins1[i].id+'<br>Latitude : '+pins1[i].latitude+'<br>Longitude : '+pins1[i].longitude;
                            marker = new google.maps.Marker({
                            position: point,
                            map: map,
                            html:t1
                            });

                            infowindow=new google.maps.InfoWindow({
                                content: t1
                            });
                            google.maps.event.addListener(marker, 'click', function() {
                                infowindow.setContent(this.html);
                                infowindow.open(map, this);
                            });
                            markers1.push(marker);
                        }
                     }
                    html += '</tbody></table>';
                    $("#circle1").append(html);
                }
            }
            
            if(rectangle.length>0)
            {
                var heading='<h2>From Sheet 1</h2>';
                $("#rectangle1").append(heading);
                for(var j=0;j<rectangle.length;j++)
                {
                    var heading='<h3>Rectangle # '+j+'</h3>';
                     $("#rectangle1").append(heading);
                    var html = '<table class="table table-bordered">';
                    html += '<thead><tr><th>ID</th><th>Latitude</th><th>Longitude</th></tr></thead><tbody>';
                    
                    for(var i=1;i<pins1.length-1;i++)
                    {
                        point = new google.maps.LatLng(pins1[i].latitude, pins1[i].longitude);
                        
                        if(rectangle[j].overlay.getBounds().contains(point))
                        {
                            html += '<tr><td>' + pins1[i].id + '</td><td>'+pins1[i].latitude+'</td><td>'+pins1[i].longitude+'</td></tr>';
                            var t2='ID : '+pins1[i].id+'<br>Latitude : '+pins1[i].latitude+'<br>Longitude : '+pins1[i].longitude;
                            marker = new google.maps.Marker({
                            position: point,
                            map: map,
                            html:t2
                            });

                            infowindow=new google.maps.InfoWindow({
                                content: t2
                            });
                            google.maps.event.addListener(marker, 'click', function() {
                                infowindow.setContent(this.html);
                                infowindow.open(map, this);
                            });
                            markers1.push(marker);
                        }
                    }
                    html += '</tbody></table>';
                    $("#rectangle1").append(html);
                }
            }
    } 
    else
    {
        for(var k=0;k<markers1.length;k++)
            markers1[k].setMap(null);
        $('#polygon1').html('');
        $('#circle1').html('');
        $('#rectangle1').html('');
    }
    
}

function showPins2(t)
{
    if (t.is(':checked')) 
    {
        if(isFile2Selected==0)
            alert("Please select excel file first!");

            if(polygon.length>0)
            {
                var heading='<h2>From Sheet 2</h2>';
                $("#polygon2").append(heading);
                for(var j=0;j<polygon.length;j++)
                {
                    var heading='<h3>Polygon # '+j+'</h3>';
                     $("#polygon2").append(heading);
                    var html = '<table class="table table-bordered">';
                    html += '<thead><tr><th>ID</th><th>Latitude</th><th>Longitude</th></tr></thead><tbody>';
                    for(var i=1;i<pins2.length-1;i++)
                    {
                        point = new google.maps.LatLng(pins2[i].latitude, pins2[i].longitude);
                        
                        if(polygon[j].overlay.Contains(point))
                        {
                            html += '<tr><td>' + pins2[i].id + '</td><td>'+pins2[i].latitude+'</td><td>'+pins2[i].longitude+'</td></tr>';
                            var t3='ID : '+pins2[i].id+'<br>Latitude : '+pins2[i].latitude+'<br>Longitude : '+pins2[i].longitude;
                            marker = new google.maps.Marker({
                            position: point,
                            map: map,
                            html: t3
                            });

                            infowindow=new google.maps.InfoWindow({
                                content: t3
                            });
                            google.maps.event.addListener(marker, 'click', function() {
                                infowindow.setContent(this.html);
                                    infowindow.open(map, this);
                            });
                            markers2.push(marker);
                        }
                    }
                    html += '</tbody></table>';
                    $("#polygon2").append(html);
                }
            }
            
            if(circle.length>0)
            {
                var heading='<h2>From Sheet 2</h2>';
                $("#circle2").append(heading);
                for(var j=0;j<circle.length;j++)
                {
                    var heading='<h3>Circle # '+j+'</h3>';
                     $("#circle2").append(heading);
                    var html = '<table class="table table-bordered">';
                    html += '<thead><tr><th>ID</th><th>Latitude</th><th>Longitude</th></tr></thead><tbody>';
                    for(var i=1;i<pins2.length-1;i++)
                    {
                        point = new google.maps.LatLng(pins2[i].latitude, pins2[i].longitude);
                        
                        if(google.maps.geometry.spherical.computeDistanceBetween(point, (circle[j].overlay.getCenter())) <= (circle[j].overlay.getRadius()))
                        {
                            html += '<tr><td>' + pins2[i].id + '</td><td>'+pins2[i].latitude+'</td><td>'+pins2[i].longitude+'</td></tr>';
                            var t4='ID : '+pins2[i].id+'<br>Latitude : '+pins2[i].latitude+'<br>Longitude : '+pins2[i].longitude;
                            marker = new google.maps.Marker({
                            position: point,
                            map: map,
                            html:t4
                            });

                            infowindow=new google.maps.InfoWindow({
                                content: t4
                            });
                            google.maps.event.addListener(marker, 'click', function() {
                                infowindow.setContent(this.html);
                                infowindow.open(map, this);
                            });
                            markers2.push(marker);
                        }
                    }
                    html += '</tbody></table>';
                    $("#circle2").append(html);
                }
            }
            
            if(rectangle.length>0)
            {
                var heading='<h2>From Sheet 2</h2>';
                $("#rectangle2").append(heading);
                for(var j=0;j<rectangle.length;j++)
                {
                    var heading='<h3>Rectangle # '+j+'</h3>';
                    $("#rectangle2").append(heading);
                    var html = '<table class="table table-bordered">';
                    html += '<thead><tr><th>ID</th><th>Latitude</th><th>Longitude</th></tr></thead><tbody>';
                    for(var i=1;i<pins2.length-1;i++)
                    {
                        point = new google.maps.LatLng(pins2[i].latitude, pins2[i].longitude);
                        
                        if(rectangle[j].overlay.getBounds().contains(point))
                        {
                            html += '<tr><td>' + pins2[i].id + '</td><td>'+pins2[i].latitude+'</td><td>'+pins2[i].longitude+'</td></tr>';
                            var t5='ID : '+pins2[i].id+'<br>Latitude : '+pins2[i].latitude+'<br>Longitude : '+pins2[i].longitude;
                            marker = new google.maps.Marker({
                            position: point,
                            map: map,
                            html:t5
                            });

                            infowindow=new google.maps.InfoWindow({
                                content: t5
                            });
                            google.maps.event.addListener(marker, 'click', function() {
                                infowindow.setContent(this.html);
                                infowindow.open(map, this);
                            });
                            markers2.push(marker);
                        }
                    }
                    html += '</tbody></table>';
                    $("#rectangle2").append(html);
                }
            }
    } 
    else
    {
        for(var k=0;k<markers2.length;k++)
            markers2[k].setMap(null);
        $('#polygon2').html('');
        $('#circle2').html('');
        $('#rectangle2').html('');
    }
    
}



