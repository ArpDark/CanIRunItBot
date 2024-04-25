import dotenv from"dotenv";
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
dotenv.config();
const supabase = createClient(process.env.DB_URL, process.env.PUBLIC_ANON_KEY);

const PcSpecsScraper=()=>{
  const cpuScraper=async()=>{
    const url="https://browser.geekbench.com/processor-benchmarks";
    const browser= await puppeteer.launch({headless:true, timeout:300000000});
    const page= await browser.newPage();
    await page.goto(url,{timeout:300000000});
  
    const cpuData= await page.evaluate(()=>{
      const div1=document.querySelector("#single-core");
      const div2=document.querySelector("#multi-core");
      const table1=div1.querySelector("#pc");
      const table2=div2.querySelector("#pc");
      const tbody1=table1.querySelector("tbody");
      const tbody2=table2.querySelector("tbody");
      const trs1= tbody1.querySelectorAll("tr");
      const trs2= tbody2.querySelectorAll("tr");
      let cpuData1=[],i=1;
  
      trs1.forEach(element => {
        const name=element.querySelector(".name");
        const score=element.querySelector(".score");
        const str= name.textContent.replace(/\n/g, "");
        cpuData1.push({
          id:i++,
          name:str,
          singleCoreScore:Number(score.textContent),
          multiCoreScore:0
        });
      });
  
      trs2.forEach(element => {
        const name=element.querySelector(".name");
        const score=element.querySelector(".score");
        const str= name.textContent.replace(/\n/g, "");
        cpuData1.map((data)=>{
          if(data.name===str)
          {
            data.multiCoreScore=Number(score.textContent);
          }
        })
      });
  
      return cpuData1;
    });
  
    await browser.close();
    console.log(cpuData);
    const response = await supabase
    .from('Cpuspecs')
    .insert(cpuData);
    console.log(response);
  }
  const gpuScraper=async()=>{
    const url="https://browser.geekbench.com/vulkan-benchmarks";
    const browser= await puppeteer.launch({headless:true, timeout:300000000});
    const page= await browser.newPage();
    await page.goto(url,{timeout:300000000});
  
    const gpuData= await page.evaluate(()=>{
      const table=document.querySelector("#opencl");
      const tbody=table.querySelector("tbody");
      const trs= tbody.querySelectorAll("tr");
      const gpuData=[];
      let i=1;
  
      trs.forEach(element => {
        const name=element.querySelector(".name");
        const score=element.querySelector(".score");
        const str= name.textContent.replace(/\n/g, "");
        
        gpuData.push({id:i++, name:str,score:Number(score.textContent)});
      });
      return gpuData;
    });
  
    await browser.close();
    console.log(gpuData);
    const response = await supabase
    .from('Gpuspecs')
    .insert(gpuData);
    console.log(response);
    
  }
  
  gpuScraper();
  cpuScraper();
}

const GameReqsScraper=()=>{
  const reqScraper=async()=>{
    // const url="https://store.steampowered.com/app/730/CounterStrike_2/";
    // const url="https://store.steampowered.com/search/?supportedlang=english&ndl=1";
    const url="https://store.steampowered.com/search/?category1=998&supportedlang=english&ndl=1";
    const browser= await puppeteer.launch({headless:true, timeout:300000000});
    const page= await browser.newPage();
    await page.goto(url,{timeout:300000000});

    async function autoScroll(page){
      await page.evaluate(async () => {
          await new Promise((resolve, reject) => {
              let totalHeight = 0;
              const distance = 100;
              const scrollInterval = setInterval(() => {
                  const scrollHeight = document.body.scrollHeight;
                  window.scrollBy(0, distance);
                  totalHeight += distance;
                  if (totalHeight === 500) {
                      clearInterval(scrollInterval);
                      resolve();
                  }
                  // if (totalHeight >= scrollHeight) {
                  //     clearInterval(scrollInterval);
                  //     resolve();
                  // }
              }, 100);
          });
      });
    }

    await autoScroll(page);
  
    const reqData= await page.evaluate(()=>{
      // const div=document.querySelector(".game_area_sys_req_full");
      const div=document.querySelector("#search_resultsRows");
      const games=div.querySelectorAll("a");
      const gamesLink=[];
      games.forEach(element=>{
        const gamesPageLink=element.getAttribute("href");
        gamesLink.push(gamesPageLink);
      });

      return gamesLink;
    });
    await browser.close();
    console.log(reqData);
    const reqData1=reqData.slice(0,30);
    console.log(reqData1);
    const allGamesSpecs=[];
    const promises=reqData1.map(async(gamePageUrl)=>{
      // const browser= await puppeteer.launch({headless:true, timeout:300000000});
      const browser= await puppeteer.launch({headless:true,timeout:300000000});
      const page= await browser.newPage();
      await page.goto(gamePageUrl/*,{timeout:300000000}*/,{waitUntil:'domcontentloaded', timeout:300000000});
      const checkdiv=await page.$("#appHubAppName");

      if(checkdiv)
      {
        const requirements= await page.evaluate(()=>{
          const name=document.querySelector(".apphub_AppName");
          // return div.innerHTML;
          const div=document.querySelector(".sysreq_contents");
          if(div.querySelector(".game_area_sys_req_leftCol") !== null)
          {
            const minReq= div.querySelector(".game_area_sys_req_leftCol");
            const li=minReq.querySelectorAll("li");
            const obj={
              name:name.innerHTML,
              cpu:'',
              gpu:'',
              ram:''
            };
            li.forEach(element => {
              if(element.querySelector("strong")!==null)
              {
                const type=element.querySelector("strong");
                if(type.innerHTML === "Processor:")
                {
                  obj.cpu=element.textContent.slice(11,-1);
                }
                else if(type.innerHTML === "Graphics:")
                {
                  obj.gpu=element.textContent.slice(10,-1);
                }
                else if(type.innerHTML === "Memory:")
                {
                  obj.ram=parseInt(element.textContent.match(/(\d+)/)[0]);
                }
              }
            });
            return obj;
          }
          else
          {
            const minReq= div.querySelector(".game_area_sys_req_full");
            const li=minReq.querySelectorAll("li");
            const obj={
              name:name.innerHTML,
              cpu:'',
              gpu:'',
              ram:''
            };
            li.forEach(element => {
              if(element.querySelector("strong")!==null)
              {
                const type=element.querySelector("strong");

                if(type.innerHTML === "Processor:")
                {
                  obj.cpu=element.textContent.slice(11,-1);
                }
                else if(type.innerHTML === "Graphics:")
                {
                  obj.gpu=element.textContent.slice(10,-1);
                }
                else if(type.innerHTML === "Memory:")
                {
                  obj.ram=parseInt(element.textContent.match(/(\d+)/)[0]);
                }
              }
            });
            return obj;
          }
        });
        await browser.close();
        // console.log(requirements);
        allGamesSpecs.push(requirements);
      }
      else
      { 
        await page.select('#ageYear', '1990');
        await page.click("#view_product_page_btn");
        console.log("btn clicked");
        await page.waitForNavigation({timeout:300000000});
        console.log("navigation done");

        const requirements= await page.evaluate(()=>{
          const name=document.querySelector(".apphub_AppName");
          // const div=document.querySelector(".apphub_AppName");
          // return div.innerHTML;
          const div=document.querySelector(".sysreq_contents");
          if(div.querySelector(".game_area_sys_req_leftCol") !== null)
          {
            const minReq= div.querySelector(".game_area_sys_req_leftCol");
            const li=minReq.querySelectorAll("li");
            const obj={
              name:name.innerHTML,
              cpu:'',
              gpu:'',
              ram:''
            };
            li.forEach(element => {
              if(element.querySelector("strong")!==null)
              {
                const type=element.querySelector("strong");
                if(type.innerHTML === "Processor:")
                {
                  obj.cpu=element.textContent.slice(11,-1);
                }
                else if(type.innerHTML === "Graphics:")
                {
                  obj.gpu=element.textContent.slice(10,-1);
                }
                else if(type.innerHTML === "Memory:")
                {
                  obj.ram=parseInt(element.textContent.match(/(\d+)/)[0]);
                }
              }
            });
            return obj;
          }
          else
          {
            const minReq= div.querySelector(".game_area_sys_req_full");
            const li=minReq.querySelectorAll("li");
            const obj={
              name:name.innerHTML,
              cpu:'',
              gpu:'',
              ram:''
            };
            li.forEach(element => {
              if(element.querySelector("strong")!==null)
              {
                const type=element.querySelector("strong");

                if(type.innerHTML === "Processor:")
                {
                  obj.cpu=element.textContent.slice(11,-1);
                }
                else if(type.innerHTML === "Graphics:")
                {
                  obj.gpu=element.textContent.slice(10,-1);
                }
                else if(type.innerHTML === "Memory:")
                {
                  obj.ram=parseInt(element.textContent.match(/(\d+)/)[0]);
                }
              }
            });
            return obj;
          }
        });
        await browser.close();
        // console.log(requirements);
        allGamesSpecs.push(requirements);
      }
    });
    await Promise.all(promises);
    console.log(allGamesSpecs); 
    console.log(allGamesSpecs.length);

    const response = await supabase
    .from('GameMinSpecs')
    .insert(allGamesSpecs);
    console.log(response);
  }
  
  reqScraper();
}


export {PcSpecsScraper, GameReqsScraper};
