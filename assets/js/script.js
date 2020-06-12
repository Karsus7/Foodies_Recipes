$(document).ready(function(){

    //temporary variables only for development
    //TODO: delete the two variables below when releasing the project
    let srchRandomEP = "https://arielcc88.github.io/UT-FSWD-DEPLOYED/assets/srch_random.json";
    let srchByIngrdEP = "https://arielcc88.github.io/UT-FSWD-DEPLOYED/assets/srch_by_ingrd.json";

    /*-------------------------------------------
                    VAR DECLARATION
    -------------------------------------------*/
    //maps and geolocation vars
    let pos;
    let map;
    let bounds;
    let infoWindow;
    let currentInfoWindow;
    let service;
    let infoPane;
    let usrGeoFlag = false; //indicates state of geolocation permissions by user. 
    let schRandomFlag = false;

     /*-------------------------------------------
                    MAIN
    -------------------------------------------*/
    //User actions

// Event listenter for Click in text area for "Search Recipes"

    $("#rcpsearch-btn").on("click", function(event){
        // event.preventDefault();
        let strRcpEndPoint;
        if(isTextBoxEmpty($("#search-input").val())){
            //text box empty
           strRcpEndPoint = fnRcpEndPointAssembly();
           schRandomFlag = true;
        }
        else{
            //search by ingredient -- i.e apples,flour,sugar ---   apples,flour ,Sugar  
            strRcpEndPoint = fnRcpEndPointAssembly($("#search-input").val());
            schRandomFlag = false;
        }
        //call function to query rcp API
        fnQueryRcpAPI(strRcpEndPoint, schRandomFlag);
    });



    /*-------------------------------------------
                    FUNCTIONS
    -------------------------------------------*/
    //predicate function -> text input empty
    function isTextBoxEmpty(textString){
        if (textString == '') {
            return true
        } else { 
            return false
        }
    }

    //food API endpoint assembly
    function fnRcpEndPointAssembly(strIngredientList){
        let endPointURL;
        //optional argument (ingredient list)
        //if list is passed, replace commas with comma URL encoding '%252C'
        strIngredientList = strIngredientList || null;
        if (!strIngredientList) {
           //endPointURL = "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/random?number=5";
           //TODO: remove line below before release 
           endPointURL = srchRandomEP;
        }
        else{
            //using ingredient list
            strIngredientList = strIngredientList.trim().toLowerCase(); //trimming and lower case change
            strIngredientList = strIngredientList.replace(/\s/g, ""); //replacing any inner space in the string
            strIngredientList = strIngredientList.replace(/,/g, "%252C"); //replacing comma with comma encoding for URL
            // endPointURL = "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/findByIngredients?number=5&ranking=1&ignorePantry=false&ingredients=" + strIngredientList;
            endPointURL = srchByIngrdEP;
        }
        //return end point URL
        return endPointURL
    }

    // function fnStrSplitByComma(strList, isRandomSch){
    //     //verifying string not empty
    //     if (strList) {
    //         return strList.split(",");
    //     }
    // }

    //TODO: Un-comment function below when releasing project.
    // function fnQueryRcpAPI(strEndPoint){
    //     //apiSettings get passed into ajax call
    //     let apiSettings = {
    //         "async": true,
    //         "crossDomain": true,
    //         "url": strEndPoint,
    //         "method": "GET",
    //         "headers": {
    //             "x-rapidapi-host": "spoonacular-recipe-food-nutrition-v1.p.rapidapi.com",
    //             "x-rapidapi-key": "f2143b91dcmsh2ab34738e9c4db3p18fd8ajsne4052a78d8a5"
    //         }
    //     }

    //     //querying endpoint at rapid API
    //     $.ajax(apiSettings).then(function (response) {
    //         console.log(response);
    //         //TODO: call next step function to extract recipe names and query google's API
    //     });
    // }

    //Temp function for development only
    //TODO: Delete function below when releasing project. Only used for development stage
    function fnQueryRcpAPI(strEndPoint, isRandomSch){
        //apiSettings get passed into ajax call
        let apiSettings = {
            "async": true,
            "url": strEndPoint,
            "method": "GET",
        }

        //querying endpoint at rapid API
        $.ajax(apiSettings).then(function(response) {
            if (isRandomSch) {
                //call DOMAssembly function and pass reponse obj
                fnRcpListDOMAssembly(response);
            } else {
                //search by ingred extension
                //TODO: uncomment line below for release
                //fnExtendSchByIngredients(response);
                //TODO: remove line below for release
                fnRcpListDOMAssembly(response);
            }
            console.log("fnQueryRcpAPI ajax end here");
        });
    }

    function fnExtendSchByIngredients(rcpObjArr){
        let rcpInfoObj = {};
        let rcpIDString = "";
        let apiBulkQueryURL = "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/informationBulk?ids=";
        //api settings here
        let apiBulkSettings = {
            "async": true,
            "crossDomain": true,
            "url": "",
            "method": "GET",
            "headers": {
                "x-rapidapi-host": "spoonacular-recipe-food-nutrition-v1.p.rapidapi.com",
                "x-rapidapi-key": "f2143b91dcmsh2ab34738e9c4db3p18fd8ajsne4052a78d8a5"
            }
        };
        //----
        //extract the recipe ids for bulk query
        rcpObjArr.forEach((element,index) => {
            rcpIDString += element.id
            if (!(index === rcpObjArr.length - 1)) {
                rcpIDString += ",";
            }
        });
        //updating apiBulkSettings with url
        apiBulkSettings["url"] = apiBulkQueryURL + rcpIDString;
        //TODO: delete below line for releasing
        ////apiBulkSettings["url"] = "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/informationBulk?ids=65597";

        //second ajax call to rcp API to extract additional information
        $.ajax(apiBulkSettings).then(function(responseBulk){
            if (responseBulk) {
                //ensuring no empty array is pushed to previous object
                rcpInfoObj["recipes"] = responseBulk;
                //pushing bulk object into schByIng object
                rcpObjArr.push(rcpInfoObj);
                //console.log("search by Ing updated ", rcpObjArr);

                //call DOM Assembly function below
                fnRcpListDOMAssembly(rcpObjArr);
            }
        });
    }



    function fnRcpListDOMAssembly(rcpData){
        //
    }


    function fnGeolocationUser(mapCtnerId, rcpName){
        if (!usrGeoFlag) {
            //either browser doesn't support geolocation or usr blocked permissions.
            //HTML5 geolocation
            if (navigator.geolocation) { //checking if browser supports geolocation property
                //navigator.geolocation.getCurrentPosition(success, error, options)
                navigator.geolocation.getCurrentPosition(position => { //on success a callback function is called with position object as only input param.
                pos = {
                    //pos object to center new map on.
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                usrGeoFlag = true; 
                console.log("geo approved ", usrGeoFlag);
                console.log("usr coords ", pos);
                fnMapsRender(usrGeoFlag, true, mapCtnerId, rcpName);
            }, () => {
                // Browser supports geolocation, but user has denied permission
                fnMapsRender(usrGeoFlag, true, mapCtnerId, rcpName);
                });
            } else {
                // Browser doesn't support geolocation
                fnMapsRender(usrGeoFlag, false, mapCtnerId, rcpName);
            }
        }
        else {
            //usr has already granted geolocation permissions.
            fnMapsRender(usrGeoFlag, true, mapCtnerId, rcpName);
        }        
    }

    // Handle a geolocation error
    function fnMapsRender(geoFlag, browserHasGeolocation, mapCtnerElementId, rcpName) {
        //clearing content on element
        $("#" + mapCtnerElementId).empty();
        // Initialize variables
        bounds = new google.maps.LatLngBounds(); //new instance of Maps API Class LatLngBounds. Represents a rectangle in geographical coordinates
        infoWindow = new google.maps.InfoWindow; //popup window above the map at a given location to display content
        currentInfoWindow = infoWindow;
        //checking geoFlag to determine whether normal rendering or default location
        if (geoFlag) {
            //normal rendering. usr's location
            map = new google.maps.Map(document.getElementById(mapCtnerElementId), {
                    center: pos,
                    zoom: 15
                });
            bounds.extend(pos); //define the geographical rectangle with pos as center reference.
            infoWindow.setPosition(pos); //defining location on the Map where the info window will be located
            infoWindow.setContent("You are here."); //defining content of info Window
            infoWindow.open(map); //loading info window on map element
            map.setCenter(pos); //defining center view of map on user's location
        }
        else {
            //geolocation issues
            //setting default values for map object
            // Set default location to Central Texas
            pos = { lat: 30.266, lng: -97.733 };
            console.log("geolocation error ", pos);
            map = new google.maps.Map(document.getElementById(mapCtnerElementId), {
              center: pos,
              zoom: 15
            });
    
            // Display an InfoWindow at the map center
            infoWindow.setPosition(pos);
            infoWindow.setContent(browserHasGeolocation ?
              'Geolocation permissions denied. Using default location.' :
              'Error: Your browser doesn\'t support geolocation.');
            infoWindow.open(map);
            currentInfoWindow = infoWindow;
        }

        // Call Places Nearby Search on either usr's location or default
        getNearbyPlaces(pos, rcpName);
    }

    // Run a Nearby Places Search - Places where recipe could be served
    function getNearbyPlaces(position, rcpName) {
        //request object to be passed into service request method
        let request = {
            location: position,
            rankBy: google.maps.places.RankBy.DISTANCE,
            keyword: rcpName
        };
    
        service = new google.maps.places.PlacesService(map); // applying to map object to be displayed
        service.nearbySearch(request, nearbyCallback); //gets results -> create markers
    }

        // Handle the results (up to 20) of the Nearby Search
    function nearbyCallback(srvResults, srvStatus) {
        if (srvStatus == google.maps.places.PlacesServiceStatus.OK) {
            //verifying service executed correctly -> call create markers if results were found
            createMarkers(srvResults);
        }
        else if (srvStatus == "ZERO_RESULTS"){
            //displaying nearby restaurants if no results were found for the recipe
            getNearbyPlaces(pos, "restaurant");
        }
    }

    // Set markers at the location of each place result
    function createMarkers(places) {
        places.forEach(place => {
            let marker = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name
            });
    
            // click listener to each marker
            google.maps.event.addListener(marker, 'click', () => {
                let request = {
                    placeId: place.place_id,
                    fields: ['name', 'formatted_address', 'geometry', 'rating',
                    'website', 'photos']
                };
    
                /* places details only queried on demand to avoid hitting API rate limits*/
                service.getDetails(request, (placeResult, status) => {
                    showDetails(placeResult, marker, status)
                });
            });
    
            // Adjust the map bounds to include the location of this marker
            bounds.extend(place.geometry.location);
        });
        /* Once all the markers have been placed, adjust the bounds of the map to
        * show all the markers within the visible area. */
        map.fitBounds(bounds);
    }
})

