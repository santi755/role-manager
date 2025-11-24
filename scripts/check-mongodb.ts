import { connect, connection } from 'mongoose';

async function checkMongoDB() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/role-manager';

        console.log('🔌 Conectando a MongoDB...');
        console.log(`   URI: ${uri}\n`);

        await connect(uri);

        console.log('✅ Conexión exitosa!\n');

        // Obtener estadísticas de la base de datos
        const db = connection.db;
        const collections = await db.listCollections().toArray();

        console.log('📊 Colecciones encontradas:');
        console.log('═'.repeat(60));

        for (const collection of collections) {
            const collectionName = collection.name;
            const count = await db.collection(collectionName).countDocuments();
            console.log(`\n📁 ${collectionName}`);
            console.log(`   Documentos: ${count}`);

            if (count > 0) {
                const sample = await db.collection(collectionName).find().limit(3).toArray();
                console.log(`   Muestra de datos:`);
                sample.forEach((doc, idx) => {
                    console.log(`\n   [${idx + 1}]`, JSON.stringify(doc, null, 2).split('\n').join('\n   '));
                });
            }
        }

        console.log('\n' + '═'.repeat(60));
        console.log('\n✅ Verificación completada!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await connection.close();
        process.exit(0);
    }
}

checkMongoDB();
