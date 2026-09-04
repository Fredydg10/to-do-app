const Joi = require('joi');

// 1. Esquema para REGISTRO
const registroSchema = Joi.object({
    nombre: Joi.string().min(3).max(50).required().messages({
        'string.min': 'El nombre debe tener al menos 3 caracteres',
        'any.required': 'El nombre es obligatorio'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'El formato del email no es válido',
        'any.required': 'El email es obligatorio'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'La contraseña debe tener al menos 6 caracteres',
        'any.required': 'La contraseña es obligatoria'
    })
});

// 2. Esquema para LOGIN
const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'El formato del email no es válido',
        'any.required': 'El email es obligatorio'
    }),
    password: Joi.string().required().messages({
        'any.required': 'La contraseña es obligatoria'
    })
});

// 3. Esquema para CREAR/EDITAR TAREA
const tareaSchema = Joi.object({
    titulo: Joi.string().min(3).max(100).required().messages({
        'string.min': 'El título debe tener al menos 3 caracteres',
        'any.required': 'El título es obligatorio'
    }),
    descripcion: Joi.string().allow('', null).optional(),
    prioridad: Joi.string().valid('High', 'Medium', 'Low').default('Medium'),
    estado: Joi.string().valid('To-Do', 'In Progress', 'Done').default('To-Do'),
    fecha_vencimiento: Joi.date().iso().allow(null, '').optional(),
    categoria_id: Joi.number().integer().default(1)
});

// 4. Middleware que usa los esquemas
const validar = (schema) => (req, res, next) => {
    // abortEarly: false nos devuelve TODOS los errores, no solo el primero
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
        // Extraemos solo los mensajes de error en un array
        const errores = error.details.map(detalle => detalle.message);
        return res.status(400).json({ 
            error: 'Error de validación', 
            detalles: errores 
        });
    }
    
    // Si todo está bien, pasamos a la siguiente función (la ruta real)
    next();
};

module.exports = { validar, registroSchema, loginSchema, tareaSchema };