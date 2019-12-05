const mongoose = require('mongoose');
mongoose.connect(
    'mongodb://localhost:27017/imok',
    {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useFindAndModify: true
    }
);

const User = mongoose.model('imok_users', { name: String });

const user = new User({ name: 'Zildjian' });
user.save().then(() => console.log('jebać'));
