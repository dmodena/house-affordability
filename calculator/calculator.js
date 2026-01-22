function calcular(){
    const calc=document.getElementById("calculating");
    calc.textContent="Calculating...";

    const salary=Number(document.getElementById("salary").value);
    const age=Number(document.getElementById("age").value);
    const price=Number(document.getElementById("price").value);

    const fee=salary*.3;
    var months=Number(Math.abs(Math.log(Math.abs(1-(price*0.00375/fee)))/Math.log(1.00375)));
    var years= Number(Math.floor(months/12));
    months=Math.floor(months)-years*12;

    const result=document.getElementById("result");
    console.log(years+age);
    if(years+age > 80){
        result.className="error";
        result.textContent="According to your conditions, I don't think that purchase it shall be possible, mate.\nMaybe in "+years+" years and "+months+" months.";
    } else if (years+age > 50){
        result.className="warning";
        result.textContent="According to your conditions, I think you could hardly buy that property. Maybe in "+years+" years and "+months+" months.";
    } else if(years+age > 30){
        result.className="success";
        result.textContent="According to your conditions, I think you could purchase that property. Maybe in "+years+" years and "+months+" months.";
    } else {
        result.className="success";
        result.textContent="According to your conditions, I think you could really purchase that property. Maybe in "+years+" years and "+months+" months.";
    }
}
