var toMarkdown = require('to-markdown').toMarkdown;
var dao = require("mysql");
var moment = require('moment');
var config = require("./config");
var fs = require("fs");

var client = dao.createConnection({
    host: config.host,
    user: config.user,
    port: config.port,
    password: config.password,
    database: config.database
});

var query_post = "SELECT cid,title,slug,created,modified,text,status FROM " + 
                        config.tablePrefix + "contents WHERE `type` ='post' ";
var query_meta = "SELECT m.name,m.slug,m.type,m.description FROM " + 
                        config.tablePrefix + "relationships r INNER JOIN " + 
                        config.tablePrefix + "metas m ON r.mid=m.mid WHERE r.cid = ?";


client.query(query_post,function(err,rows){
    if(err){
        throw err;
    }
    rows.forEach(function(r){
        var title = r.title;
        var slug = r.slug;
        var text = r.text;
        var tags = [];
        var cat = null;
        var date = moment.unix(r.created).format("YYYY-MM-DD HH:mm:ss");

        client.query(query_meta,[r.cid],function(err,metas){
            if(!err){
                metas.forEach(function(m){
                    if(m['type'] == 'tag'){
                        tags.push(m['name']);
                    }else{
                        cat = m['name'];
                    }
                });                
            }

            if(!fs.existsSync("./_post")){
                fs.mkdirSync("./_post");
            }

            var filename = "./_post/" + slug + ".md";
            if(fs.existsSync(filename)){
                fs.unlinkSync(filename);
            }
            fs.appendFileSync(filename, "title: " + title + "\n");
            fs.appendFileSync(filename, "date: " + date + "\n");
            if(cat != null){
                fs.appendFileSync(filename, "categories: " + cat + "\n");
            }
            if(tags.length > 0){
                if(tags.length > 1){
                    fs.appendFileSync(filename, "tags: [" + tags.toString() + "]\n");
                }else{
                    fs.appendFileSync(filename, "tags: " + tags.toString() + "\n");
                }
            }
            fs.appendFileSync(filename, "---\n\n");
            fs.appendFileSync(filename, toMarkdown(text));
        });

    });

    client.end();
});
