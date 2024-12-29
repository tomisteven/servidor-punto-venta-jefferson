JWT_SECRET =
PORT =
MONGO_URL =

CLOUDINARY_NAME=
API_KEY_CLOUDINARY=
API_SECRET_CLOUDINARY=



//funciones

-----> JUGADOR <-----

    POST
        afiiarJugadorAClub()
        crearNuevoJugador()
        cancelarPartidoJugador() *falta*
        unirseAPartidoActivo()
    GET
        obtenerJugadorLogueado()
        seccionarPorClubYCategoria() *debe estar en sistema*
        listarJugadoresXClub() *debe estar en sistema*
        listarXLocalidad() *debe estar en sistema*
    PATCH
        modificarJugador()
        desafiliarJugadorDeClub()
    DELETE
        eliminarJugador() *falta*
        eliminarPartidoCreado() *falta*

-----> PARTIDO <-----

    