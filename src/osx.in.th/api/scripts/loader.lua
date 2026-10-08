local HttpService = game:GetService("HttpService")
local Stats = game:GetService("Stats")

print("DEBUG [OSX]: Loader script started")

-- [[ CONFIGURATION ]] --
local API_URL = "https://osx.in.th/api" -- ปรับเป็น Domain ของคุณ
local Domain = "osx.in.th"
local WebhookURL = "https://discord.com/api/webhooks/1490398138220019825/jlZBTnlWn2ZWKEd4bvBUYjQrnQXCX4N9MjfVSK0ceBqQQVIBHaZQ4xDcPnCnA0SlDbAs"

-- [[ GET GAME NAME ]] --
local function getGameName()
    local success, productInfo = pcall(function()
        return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId)
    end)
    return success and productInfo and productInfo.Name or "Unknown Game"
end

local GameName = getGameName()

-- [[ LOGGING SYSTEM ]] --
local function SendLog(key)
    task.spawn(function()
        local success, ip = pcall(function() return game:HttpGet("https://api4.ipify.org/") end)
        local hwid = game:GetService("RbxAnalyticsService"):GetClientId()
        local time = os.date("%X")
        
        local payload = {
            ["username"] = "𝗢𝗦𝗫 𝗛𝗨𝗕 - 𝗟𝗢𝗚 𝗨𝗦𝗘 𝗦𝗖𝗥𝗜𝗣𝗧",
            ["avatar_url"] = "https://media.discordapp.net/attachments/1485621966575501312/1488393679117881344/logo512v2.png?ex=69d335a2&is=69d1e422&hm=9403f72a1903c8fa334cf883d7f906b1c06b8e3e6c7432b5b1e6b50fe8281e22&=&format=webp&quality=lossless",
            ["embeds"] = {{
                ["title"] = "[!] : 𝗧𝗵𝗲 𝘀𝘆𝘀𝘁𝗲𝗺 𝗱𝗲𝘁𝗲𝗰𝘁𝗲𝗱 𝘁𝗵𝗲 𝘂𝘀𝗲 𝗼𝗳 𝗮 𝘀𝗰𝗿𝗶𝗽𝘁.",
                ["description"] = string.format(
                    "――――――――――――――――――――――\n\n**👤 User :**  ```%s```\n**🎮 Script Name :** ```%s```\n**🖥️ HWID :** ```%s```\n**🔐 KEY :** ```%s```\n**🗺️ IP :** ```%s```\n**❌ ACC BAN :** ```%s```\n**🧾Reason :** ```%s```\n** ⏳ Time Data :** ```%s```\n\n――――――――――――――――――――――",
                    game:GetService("Players").LocalPlayer.Name, GameName, hwid, (key or "None"), (success and ip or "Unknown"), "None", "None", time
                ),
                ["color"] = 34303,
                ["footer"] = {
                    ["text"] = "© 2026 Osx Hub. All rights reserved.",
                    ["icon_url"] = "https://media.discordapp.net/attachments/1485621966575501312/1488393679117881344/logo512v2.png?ex=69d335a2&is=69d1e422&hm=9403f72a1903c8fa334cf883d7f906b1c06b8e3e6c7432b5b1e6b50fe8281e22&=&format=webp&quality=lossless"
                },
                ["image"] = {
                    ["url"] = "https://media.discordapp.net/attachments/1485621966575501312/1490364198008393818/standard_1.gif?ex=69d3c952&is=69d277d2&hm=84671fab55d2308ed14c9bd662582a0e6170d1ed0a55c8c6fcbe0cdbbea901fd&="
                }
            }}
        }
        
        local successPost, err = pcall(function()
            (request or http_request or (http and http.request))({
                Url = WebhookURL,
                Method = "POST",
                Headers = {["Content-Type"] = "application/json"},
                Body = HttpService:JSONEncode(payload)
            })
        end)
    end)
end

-- [[ GET HWID ]] --
local function getHWID()
    local success, id = pcall(function()
        -- ใช้ RbxAnalyticsService เพื่อความแม่นยำสูงสุด
        return game:GetService("RbxAnalyticsService"):GetClientId()
    end)
    return success and id or "Unknown"
end

local hwid = getHWID()

-- [[ SAFE LOAD OSX_LIB ]] --
local OSX = nil
local osxSuccess, osxContent = pcall(function()
    return game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick())
end)

if osxSuccess and osxContent and not string.find(osxContent, "<!DOCTYPE") then
    print("DEBUG [OSX]: OSX_Lib source fetched successfully")
    local func, err = loadstring(osxContent)
    if func then
        OSX = func()
        print("DEBUG [OSX]: OSX_Lib initialized")
    else
        print("DEBUG [OSX]: loadstring(OSX) failed: " .. tostring(err))
    end
else
    -- Fallback to local file if on local environment or 404
    local success, localLib = pcall(function() 
        local content = loadfile("OSX_Lib.lua")
        return content and content() or nil
    end)
    if success and localLib then
        OSX = localLib
        print("DEBUG [OSX]: OSX_Lib loaded from local file")
    else
        warn("❌ [OSX] ไม่สามารถโหลด OSX_Lib ได้ (URL 404 or File Missing)")
        return
    end
end

-- [[ FUNCTIONS ]] --
local function verifyKey(key)
    local cleanKey = tostring(key):match("^%s*(.-)%s*$") or tostring(key)
    if cleanKey == "" then return { success = false, message = "กรุณากรอก Key" } end
    
    local url = API_URL .. "/verify.php?key=" .. cleanKey .. "&hwid=" .. hwid .. "&placeId=" .. tostring(game.PlaceId)
    
    local success, response = pcall(function()
        return game:HttpGet(url)
    end)
    
    if success and response then
        local decodeSuccess, data = pcall(function()
            return HttpService:JSONDecode(response)
        end)
        
        if decodeSuccess and data then
            return data
        else
            return { success = false, message = "เซิร์ฟเวอร์ตอบกลับผิดพลาด" }
        end
    else
        print("DEBUG [OSX]: verifyKey connection failed")
        return { success = false, message = "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" }
    end
end

-- [[ KEY SAVING SYSTEM ]] --
local keyFileName = "OSX_Hub_Key.txt"

local function getSavedKey()
    local success, result = pcall(function()
        if isfile and isfile(keyFileName) then
            return readfile(keyFileName)
        end
    end)
    if success and result and type(result) == "string" then
        return result:match("^%s*(.-)%s*$") or ""
    end
    return ""
end

local function saveKey(key)
    pcall(function()
        if writefile then
            local cleanKey = tostring(key):match("^%s*(.-)%s*$") or tostring(key)
            if cleanKey ~= "" then
                writefile(keyFileName, cleanKey)
            end
        end
    end)
end

local function deleteKey()
    pcall(function()
        if delfile and isfile and isfile(keyFileName) then
            delfile(keyFileName)
        elseif writefile then
            writefile(keyFileName, "")
        end
    end)
end

local function loadMainScript(inputKey)
    local cleanKey = tostring(inputKey):match("^%s*(.-)%s*$") or tostring(inputKey)
    -- ใช้ API Secure เพื่อดึงสคริปต์
    local secureUrl = API_URL .. "/get-script.php?key=" .. cleanKey .. "&hwid=" .. hwid .. "&placeId=" .. tostring(game.PlaceId)
    
    local getScriptSuccess, scriptContent = pcall(function()
        return game:HttpGet(secureUrl)
    end)
    
    if getScriptSuccess and scriptContent then
        if string.find(scriptContent, "<!DOCTYPE") then
            warn("❌ [OSX] Server returned HTML (Error)")
            return
        end
        
        local func, err = loadstring(scriptContent)
        if func then
            local success, err = pcall(func)
            if not success then
                warn("❌ [OSX] Execution Error: " .. tostring(err))
                if OSX and OSX.Notify then
                    OSX:Notify({
                        Title = "OSX HUB",
                        Content = "❌ เกิดข้อผิดพลาดขณะรันสคริปต์: " .. tostring(err),
                        Duration = 5
                    })
                end
            end
        else
            warn("❌ [OSX] Script Syntax Error: " .. tostring(err))
        end
    else
        warn("❌ [OSX] Failed to fetch script")
    end
end

print("DEBUG [OSX]: Checking saved key")
local savedKey = getSavedKey()

if savedKey ~= "" then
    local result = verifyKey(savedKey)
    if result.success then
        if result.auto_key == false then
            print("DEBUG [OSX]: Auto Key is disabled on website for this user")
            deleteKey()
        else
            print("DEBUG [OSX]: Auto Login Success!")
            if OSX and OSX.Notify then
                OSX:Notify({
                    Title = "OSX HUB",
                    Content = "✅ เข้าสู่ระบบอัตโนมัติสำเร็จ! กำลังประมวลผลสคริปต์...",
                    Duration = 5
                })
            end
            task.wait(1)
            SendLog(savedKey)
            loadMainScript(savedKey)
            return -- Exit loader, no need to create UI
        end
    else
        print("DEBUG [OSX]: Auto Login Failed - " .. tostring(result.message))
        -- Only delete key if it was explicitly rejected as invalid or banned
        -- DO NOT delete key on network errors, script updates, or game not purchased!
        if result.message and (string.find(result.message, "Invalid") or string.find(result.message, "denied") or string.find(result.message, "banned") or string.find(result.message, "หมดอายุ")) then
            deleteKey()
            savedKey = ""
        end
    end
end

print("DEBUG [OSX]: Creating Login Window")

-- [[ UI SETUP ]] --
local Window = OSX:CreateWindow({
    Title = "OSX HUB | LOGIN SYSTEM",
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

local LoginTab = Window:AddTab({ 
    Title = "Login", 
    Icon = "lock",
    SubDescription = "Enter your license key"
})

local SecurityPanel = LoginTab:AddPanel("Security Authentication")

local inputKey = savedKey or ""
SecurityPanel:AddInput({
    Title = "License Key",
    Default = savedKey or "",
    Callback = function(Value)
        inputKey = Value
    end
})

SecurityPanel:AddButton({
    Title = "Verify & Load Script",
    Description = "ตรวจสอบ Key และเริ่มรันสคริปต์ความปลอดภัย",
    Callback = function()
        print("DEBUG [OSX]: Login button clicked")
        
        local cleanInput = tostring(inputKey):match("^%s*(.-)%s*$") or tostring(inputKey)
        
        OSX:Notify({
            Title = "OSX HUB",
            Content = "กำลังตรวจสอบความถูกต้อง...",
            Duration = 3
        })
        
        local result = verifyKey(cleanInput)
        
        if result.success then
            OSX:Notify({
                Title = "OSX HUB",
                Content = "✅ สำเร็จ! กำลังประมวลผลสคริปต์...",
                Duration = 5
            })
            
            -- บันทึกคีย์ลงเครื่องเมื่อเปิด Auto Key บนเว็บ
            if result.auto_key == false then
                deleteKey()
            else
                saveKey(cleanInput)
            end
            
            task.wait(1)
            Window:Destroy()
            
            SendLog(cleanInput)
            loadMainScript(cleanInput)
        else
            OSX:Notify({
                Title = "OSX HUB",
                Content = "❌ " .. result.message,
                Duration = 5
            })
        end
    end
})

local GetKeyPanel = LoginTab:AddPanel("How to Get Key?")
GetKeyPanel:AddButton({
    Title = "Get Key",
    Description = "กดเพื่อคัดลอกลิงก์ Discord สำหรับรับคีย์",
    Callback = function()
        setclipboard("https://discord.gg/osxhub")
        OSX:Notify({
            Title = "OSX HUB",
            Content = "Discord Link Copied! Plz Join Discord to Get Key.",
            Duration = 10
        })
    end
})

