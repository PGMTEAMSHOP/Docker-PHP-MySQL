-- [[ Slime Slaying | OSX HUB ]] --
-- UI Library Loader
local success, OSX = pcall(function()
    -- Attempt to load local dev file first (for developers)
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
local GameName = success and productInfo and productInfo.Name or "Universal"

-- [[ SERVICES ]] --
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local localPlayer = Players.LocalPlayer

-- Window Setup
local Window = OSX:CreateWindow({
    Title = "OSX HUB | " .. GameName,
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

-- Variables
_G.AutoFarm = false
_G.SelectedSlime = "Green Slime"
_G.AutoAttack = false
_G.AutoCollectShard = false
_G.AutoStrength = false
_G.AutoAgility = false
_G.AutoVitality = false
_G.AutoStamina = false
_G.StatAmount = 1
_G.WalkSpeed = 16

-- [[ MOVEMEMENT FUNCTIONS ]] --
local CurrentTween = nil
local function TweenTo(cf, speed)
    local char = localPlayer.Character
    local hrp = char and char:FindFirstChild("HumanoidRootPart")
    if not hrp then return end
    
    local dist = (hrp.Position - cf.Position).Magnitude
    local duration = dist / (speed or 100)
    
    if CurrentTween then CurrentTween:Cancel() end
    CurrentTween = TweenService:Create(hrp, TweenInfo.new(duration, Enum.EasingStyle.Linear), {CFrame = cf})
    CurrentTween:Play()
end

-- Main Tab
local MainTab = Window:AddTab({
    Title = "Main Controls",
    SubDescription = "Automation & Farming",
    Icon = "home"
})

local FarmPanel = MainTab:AddPanel("Farming Modules")

FarmPanel:AddToggle({
    Title = "Auto Collect Shards",
    Description = "เลื่อนไปเก็บ Shard ในแมพให้อัตโนมัติ (Tween)",
    Default = false,
    Callback = function(Value) _G.AutoCollectShard = Value end
})
local CombatTab = Window:AddTab({
    Title = "Combat",
    SubDescription = "Skill & Ability Settings",
    Icon = "zap"
})

-- Combat Tab (No active features yet)

-- Player Tab
local PlayerTab = Window:AddTab({
    Title = "Local Player",
    SubDescription = "Character Enhancements",
    Icon = "user"
})

local StatsPanel = PlayerTab:AddPanel("Character Stats")

StatsPanel:AddSlider({
    Title = "WalkSpeed",
    Description = "ปรับความเร็วในการวิ่งของตัวละคร",
    Min = 16,
    Max = 300,
    Default = 16,
    Callback = function(Value)
        _G.WalkSpeed = Value
        if game.Players.LocalPlayer.Character and game.Players.LocalPlayer.Character:FindFirstChild("Humanoid") then
            game.Players.LocalPlayer.Character.Humanoid.WalkSpeed = Value
        end
    end
})

StatsPanel:AddSlider({
    Title = "JumpPower",
    Description = "ปรับระยะการกระโดดของตัวละคร",
    Min = 50,
    Max = 500,
    Default = 50,
    Callback = function(Value)
        if game.Players.LocalPlayer.Character and game.Players.LocalPlayer.Character:FindFirstChild("Humanoid") then
            game.Players.LocalPlayer.Character.Humanoid.JumpPower = Value
            game.Players.LocalPlayer.Character.Humanoid.UseJumpPower = true
        end
    end
})

local AutoStatsPanel = PlayerTab:AddPanel("Auto Stats (Automation)")

AutoStatsPanel:AddInput({
    Title = "Amount to Spend",
    Description = "จำนวนแต้มที่จะอัปในแต่ละคลิก",
    Placeholder = "Enter amount (e.g. 1)...",
    Default = "1",
    Callback = function(Value)
        _G.StatAmount = tonumber(Value) or 1
    end
})

AutoStatsPanel:AddToggle({
    Title = "Auto Strength",
    Description = "อัปค่า Strength อัตโนมัติ",
    Default = false,
    Callback = function(Value) _G.AutoStrength = Value end
})

AutoStatsPanel:AddToggle({
    Title = "Auto Agility",
    Description = "อัปค่า Agility อัตโนมัติ",
    Default = false,
    Callback = function(Value) _G.AutoAgility = Value end
})

AutoStatsPanel:AddToggle({
    Title = "Auto Vitality",
    Description = "อัปค่า Vitality อัตโนมัติ",
    Default = false,
    Callback = function(Value) _G.AutoVitality = Value end
})

AutoStatsPanel:AddToggle({
    Title = "Auto Stamina",
    Description = "อัปค่า Stamina อัตโนมัติ",
    Default = false,
    Callback = function(Value) _G.AutoStamina = Value end
})

-- Settings Tab
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
    Callback = function()
        Window:Destroy()
        OSX:Notify({Title = "System", Content = "UI Destroyed Successfully."})
    end
})

OSX:Notify({
    Title = "OSX HUB Loaded",
    Content = "SlimeSlaying.lua is ready for battle!",
    Duration = 5
})

print("SlimeSlaying UI Loaded.")

-- [[ COLLECTION LOGIC ]] --
local function GetNearestShard()
    local target, distance = nil, math.huge
    local hrp = localPlayer.Character and localPlayer.Character:FindFirstChild("HumanoidRootPart")
    if not hrp then return nil end
    
    local folder = workspace:FindFirstChild("Folder")
    if folder then
        for _, v in ipairs(folder:GetChildren()) do
            if v.Name == "Shard" then
                local shardPart = v:FindFirstChild("Shard") or v.PrimaryPart
                if shardPart then
                    local dist = (shardPart.Position - hrp.Position).Magnitude
                    if dist < distance then
                        distance, target = dist, v
                    end
                end
            end
        end
    end
    return target
end

task.spawn(function()
    while true do
        task.wait(0.5)
        if _G.AutoCollectShard then
            local shard = GetNearestShard()
            if shard then
                local shardPart = shard:FindFirstChild("Shard") or shard.PrimaryPart
                if shardPart then
                    print("[OSX HUB] Collecting Shard...")
                    -- Tween to Shard
                    while _G.AutoCollectShard and shard and shard.Parent do
                        local dist = (shardPart.Position - localPlayer.Character.HumanoidRootPart.Position).Magnitude
                        if dist < 5 then
                            -- Invoke Remote
                            pcall(function()
                                game:GetService("ReplicatedStorage"):WaitForChild("Packages"):WaitForChild("Knit"):WaitForChild("Services"):WaitForChild("EnemyService"):WaitForChild("RF"):WaitForChild("CollectPickUp"):InvokeServer("Shard")
                            end)
                            task.wait(0.5)
                            break
                        end
                        TweenTo(shardPart.CFrame, 100)
                        task.wait(0.1)
                    end
                    if CurrentTween then CurrentTween:Cancel() CurrentTween = nil end
                end
            end
        end
    end
end)

-- [[ AUTO STATS LOGIC ]] --
task.spawn(function()
    while true do
        task.wait(0.1)
        local stats = {
            ["Strength"] = _G.AutoStrength,
            ["Agility"] = _G.AutoAgility,
            ["Vitality"] = _G.AutoVitality,
            ["Stamina"] = _G.AutoStamina
        }
        
        for statName, isEnabled in pairs(stats) do
            if isEnabled then
                pcall(function()
                    game:GetService("ReplicatedStorage"):WaitForChild("Packages"):WaitForChild("Knit"):WaitForChild("Services"):WaitForChild("PlayerHandler"):WaitForChild("RF"):WaitForChild("UseStatPoint"):InvokeServer(statName, _G.StatAmount or 1)
                end)
            end
        end
    end
end)
