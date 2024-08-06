create database test1;
use test1;
create table user(
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre varchar(255) not null,
    apellido varchar(255) not null,
    correo varchar(255) not null,
    password varchar(255) not null
);
create table unidad(
    user_id int not null,
    nivel_id int not null AUTO_INCREMENT,
    nombre varchar(255) not null,
    foreign key(user_id) references user(id),
    primary key(nivel_id)  -- Primary key only on nivel_id
);

create table niveles(
    nivel_id int primary key,
    contexto int DEFAULT 0,
    significado int DEFAULT 0,
    central int DEFAULT 0,
    conexiones int DEFAULT 0,
    estructura int DEFAULT 0,
    inferencias int DEFAULT 0,
    textuales int DEFAULT 0,
    foreign key(nivel_id) references unidad(nivel_id)
);

create table preguntas(
    id int AUTO_INCREMENT primary key,
    tipo varchar(255),
    nivel varchar(255),
    texto varchar(5000),
    subrayado varchar(1000) DEFAULT null,
    pregunta_correcta varchar(1000),
    pregunta_incorrecta1 varchar(1000),
    pregunta_incorrecta2 varchar(1000),
    pregunta_incorrecta3 varchar(1000),
    explicacion_correcta varchar(1000),
    explicacion_incorrecta1 varchar(1000),
    explicacion_incorrecta2 varchar(1000),
    explicacion_incorrecta3 varchar(1000)
);
create table examen(
    user_id int NOT NULL,
    examen_id int NOT NULL AUTO_INCREMENT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total int not null,
    nivel varchar(255) not null,
    foreign key(user_id) references user(id),
    primary key(examen_id)
);
create table puntajes_general(
    id_puntaje int not null AUTO_INCREMENT,
    id_examen int not null,
    basico_decodificacion int DEFAULT 0,
    medio_decodificacion int DEFAULT 0,
    avanzado_decodificacion int DEFAULT 0,

    basico_literal int DEFAULT 0,
    medio_literal int DEFAULT 0,
    avanzado_literal int DEFAULT 0,

    basico_inferencial int DEFAULT 0,
    medio_inferencial int DEFAULT 0,
    avanzado_inferencial int DEFAULT 0,
    foreign key(id_examen) references examen(examen_id),
    primary key(id_puntaje)
);
create table puntajes_unidad(
    id_puntaje int not null AUTO_INCREMENT,
    id_examen int not null,
    decodificacion int DEFAULT 0,
    literal int DEFAULT 0,
    inferencial int DEFAULT 0,
    foreign key(id_examen) references examen(examen_id),
    primary key(id_puntaje)
);



/*Create USER "Lautaro" "Beck" ""
SELECT FROM USER WHERE NOMBRE="LAUTARO" APELLIDO="BECK"

