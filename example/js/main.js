var b = color.bar( document.querySelector( "main" ) )
    .data([
        { movie: "American Beauty", studio: "Paramount", genre: "Drama", count: 40, number: 1 },
        { movie: "Star Wars", studio: "Paramount", genre: "Sci-Fi", count: 39, number: 5 },
        { movie: "Blade Runner", studio: "Paramount", genre: "Sci-Fi", count: 27, number: 8 },
        { movie: "Pulp Fiction", studio: "Universal", genre: "Drama", count: 13, number: 2 },
        { movie: "Men in Black", studio: "Universal", genre: "Sci-Fi", count: 5, number: 4 },
    ])
    .x( "movie" )
    .y( "count" )
    .draw();

window.onload = function () {
    var gui = new dat.GUI();
    var x = "movie", x1 = "", y = "count", color = "", size = "",
        background = "#F3F3F3";

    var obj = {
        set x ( _x ) {
            b.x( x = _x ).draw();
        },
        get x () { return x },

        set x1 ( _x ) {
            b.x1( x1 = _x ).draw();
        },
        get x1 () { return x1 },

        set y ( _y ) {
            b.y( y = _y ).draw()
        },
        get y () { return y },

        set color ( _color ) {
            var options = { colors: [ "red", "green", "blue", "orange", "yellow" ] };
            if ( _color == "number" || _color == "count" ) {
                options = { from: "#edf8fb", to: "#006d2c" };
            }

            b.color( color = _color, options ).draw();
        },
        get color () { return color },

        set size ( _size ) {
            b.size( size = _size ).draw();
        },
        get size () { return size },

        set background ( _background ) {
            var main = document.querySelector( "main" );
            main.style.background = background = _background;
        },
        get background () { return background }
    }

    gui.add( obj, "x", { Movie: "movie", Genre: "genre", Studio: "studio" } )
    gui.add( obj, "x1", { None: "", Movie: "movie", Genre: "genre", Studio: "studio" } )
    gui.add( obj, "y", { Count: "count", Number: "number" } )
    gui.add( obj, "color", { Auto: "", Movie: "movie", Genre: "genre", Studio: "studio", Count: "count", Number: "number" } )
    gui.addColor( obj, "background" )
    obj.background = background;
}