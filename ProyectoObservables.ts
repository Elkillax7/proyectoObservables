declare var require;
const inquirer = require('inquirer');
const fs = require('fs');
const rxjs = require('rxjs');
const mergeMap = require('rxjs/operators').mergeMap;
const map = require('rxjs/operators').map;

const preguntaMenu = {
    type: 'list',
    name: 'opcionMenu',
    message: 'Escoja una opción: ',
    choices: [
        '1.- Crear Producto',
        '2.- Borrar Producto',
        '3.- Buscar Producto',
        '4.- Actualizar Producto',
    ]
};
const ingresarProductos = [{
    name: 'nombre',
    type: 'input',
    message: 'Ingrese el nombre del producto: '
},{
    name: 'categoria',
    type: 'input',
    message: 'Ingrese la categoria del producto: '
},{
    name: 'precio',
    type: 'input',
    message: 'Ingrese el precio del producto: '
}];
const preguntaBuscarProducto = [
    {
        type: 'input',
        name: 'nombre',
        message: 'Ingrese el nombre del producto',
    }
];
const preguntaEdicionProducto = [{
    name: 'nombre',
    type: 'input',
    message: 'Ingrese el nuevo nombre del producto: '
}, {
    name: 'categoria',
        type: 'input',
        message: 'Ingrese la nueva categoria del producto: '
}, {
    name: 'precio',
        type: 'input',
        message: 'Ingrese el nuevo precio del producto: '
}];
function inicialiarBDD() {

    return new Promise(
        (resolve, reject) => {
            fs.readFile(
                'bdd.json',
                'utf-8',
                (error, contenidoArchivo) => { // CALLBACK
                    if (error) {

                        fs.writeFile(
                            'bdd.json',
                            '{"productos":[]}',
                            (error) => {
                                if (error) {
                                    reject({
                                        mensaje: 'Error creando',
                                        error: 500
                                    })
                                } else {
                                    resolve({
                                        mensaje: 'BDD leida',
                                        bdd: JSON.parse('{"usuarios":[]}')
                                    })
                                }

                            }
                        )

                    } else {
                        resolve({
                            mensaje: 'BDD leida',
                            bdd: JSON.parse(contenidoArchivo)
                        })
                    }
                }
            )
        }
    );

}

function main() {
    const respuestaBDD$ = rxjs.from(inicialiarBDD());
    respuestaBDD$
        .pipe(
            preguntarOpcionesMenu(),
            opcionesRespuesta(),
            ejecutarAcccion(),
            guardarBaseDeDatos()
        )
        .subscribe(
            (data) => {
                //
                console.log(data);
            },
            (error) => {
                //
                console.log(error);
            },
            () => {
                main();
                console.log('Complete');
            }
        )



}

function guardarBDD(bdd: BDD) {
    return new Promise(
        (resolve, reject) => {
            fs.writeFile(
                'bdd.json',
                JSON.stringify(bdd),
                (error) => {
                    if (error) {
                        reject({
                            mensaje: 'Error creando',
                            error: 500
                        })
                    } else {
                        resolve({
                            mensaje: 'BDD guardada',
                            bdd: bdd
                        })
                    }

                }
            )
        }
    )
}
function preguntarOpcionesMenu() {
    return mergeMap( // Respuesta Anterior Observable
        (respuestaBDD: RespuestaBDD) => {
            return rxjs.from(inquirer.prompt(preguntaMenu)).pipe(
                map( // respuesta ant obs
                    (respuesta: OpcionMenu) => {
                        respuestaBDD.opcionMenu = respuesta;
                        return respuestaBDD
                    }
                )
            );

        }
    )
}
function opcionesRespuesta() {
    return mergeMap(
        (respuestaBDD: RespuestaBDD) => {
            const opcion = respuestaBDD.opcionMenu.opcionMenu;
            switch (opcion) {
                case 'Crear Producto':
                    return rxjs
                        .from(inquirer.prompt(ingresarProductos))
                        .pipe(
                            map(
                                (producto: Productos) => { // resp ant OBS
                                    respuestaBDD.producto = producto;
                                    return respuestaBDD;
                                }
                            )
                        );
                case 'Buscar Producto':
                    return buscarProducto(respuestaBDD);
                    break;
                case 'Actualizar Producto':
                    return preguntarNombre(respuestaBDD);
                case 'Borrar Producto':
                    return borrarProducto(respuestaBDD);
                    break;
            }
        }
    )
}
function guardarBaseDeDatos() {
    return mergeMap(// Respuesta del anterior OBS
        (respuestaBDD: RespuestaBDD) => {
            // OBS
            return rxjs.from(guardarBDD(respuestaBDD.bdd))
        }
    )
}

function ejecutarAcccion() {
    return map( // Respuesta del anterior OBS
        (respuestaBDD: RespuestaBDD) => {
            const opcion = respuestaBDD.opcionMenu.opcionMenu;
            switch (opcion) {
                case 'Crear Producto':
                    const producto = respuestaBDD.producto;
                    respuestaBDD.bdd.productos.push(producto);
                    return respuestaBDD;
                case 'Actualizar Producto':
                    const indice = respuestaBDD.indiceUsuario;
                    respuestaBDD.bdd.productos[indice].nombre = respuestaBDD.producto.nombre;
                    respuestaBDD.bdd.productos[indice].categoria = respuestaBDD.producto.categoria;
                    respuestaBDD.bdd.productos[indice].precio= respuestaBDD.producto.precio
                    return respuestaBDD;

                case 'Borrar Producto':
                    return respuestaBDD;
                case 'Buscar Producto':
                    return respuestaBDD;
            }
        }
    )
}
function preguntarNombre(respuestaBDD: RespuestaBDD) {
    return rxjs
        .from(inquirer.prompt(preguntaBuscarProducto))
        .pipe(
            mergeMap( // RESP ANT OBS
                (respuesta: BuscarProductoPorNombre) => {
                    const indiciProducto=respuestaBDD.bdd.productos
                        .findIndex( // -1
                            (producto) => {
                                return producto.nombre === respuesta.nombre
                            }
                        );
                    if (indiciProducto === -1) {
                        console.log('preguntando de nuevo');
                        return preguntarNombre(respuestaBDD);
                    } else {
                        console.log(indiciProducto);
                        respuestaBDD.indiceUsuario = indiciProducto;
                        return rxjs.from(inquirer.prompt(preguntaEdicionProducto)).pipe(
                            map(
                              (respuesta: Productos)=>{
                                   respuestaBDD.producto ={
                                            nombre:respuesta.nombre,
                                            categoria:respuesta.categoria,
                                            precio: respuesta.precio
                                        };
                                        return respuestaBDD;
                                    }
                                )
                            );
                    }
                }
            )
        );
}
function borrarProducto(respuestaBDD: RespuestaBDD) {
    return rxjs
        .from(inquirer.prompt(preguntaBuscarProducto))
        .pipe(
            mergeMap( // RESP ANT OBS
                (respuesta: BuscarProductoPorNombre) => {
                    const indiceProducto = respuestaBDD.bdd
                        .productos
                        .findIndex( // -1
                            (producto: any) => {
                                return producto.id === respuesta.nombre
                            }
                        );
                    if (indiceProducto === -1) {
                        console.log('preguntando de nuevo');
                        return preguntarNombre(respuestaBDD);
                    } else {
                        console.log(indiceProducto);
                        return rxjs.from(promesaEliminar(respuestaBDD.bdd.productos,indiceProducto)).pipe(
                            map(() =>{
                                return respuestaBDD
                                }
                            )
                        )
                    }
                }
            )
        );
}
function buscarProducto(respuestaBDD: RespuestaBDD) {
    return rxjs
        .from(inquirer.prompt(preguntaBuscarProducto))
        .pipe(
            mergeMap(
                (respuesta: BuscarProductoPorNombre) => {
                    const indiceProducto = respuestaBDD.bdd.productos
                        .findIndex( // -1
                            (producto) => {
                                return producto.nombre === respuesta.nombre
                            }
                        );
                    if (indiceProducto === -1) {
                        console.log('preguntando de nuevo');
                        return preguntarNombre(respuestaBDD);
                    } else {
                        console.log(indiceProducto);
                        return rxjs.from(promesaBuscar(respuestaBDD.bdd.productos[indiceProducto])
                        ).pipe(
                            map(() =>{
                                return respuestaBDD
                                }
                            )
                        )
                    }
                }
            )
        );
}
const promesaBuscar = (respuestaBDD) =>{
    return new Promise(
        (resolve, reject) => {
            resolve(console.log(respuestaBDD))
        }
    )};
const promesaEliminar = (respuestaBDD,indiceProducto) =>{
    return new Promise(
        (resolve, reject) => {
            resolve(respuestaBDD.splice(indiceProducto, 1))
        }
    )};
interface RespuestaBDD {
    mensaje: string;
    bdd: BDD;
    opcionMenu?: OpcionMenu;
    indiceUsuario?: number;
    producto?: Productos;
}
interface BDD {
    productos: Productos[] | any ;
}
interface Productos {
    nombre: string;
    categoria: string;
    precio: number;
}
interface OpcionMenu {
    opcionMenu: 'Crear Producto' | 'Borrar Producto' | 'Buscar Producto' | 'Actualizar Producto';
}
interface BuscarProductoPorNombre {
    nombre: string;
}