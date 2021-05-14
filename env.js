/**
 * Created by IntelliJ IDEA.
 * User: Altanai ( @altanai)
 * Date: 2020
 * Time: 12:54 PM
 * webrtcdevelopment (https://telecom.altanai.com/)
 */
module.exports = function(fs) {

    module.readEnv = function(){
        //console.log("readConfig" , this.propertyOptions);
        return fs.readFileSync('env.json');
    };
    
    return   module;
};
