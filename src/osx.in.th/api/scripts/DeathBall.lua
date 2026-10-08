local OSX = loadstring(game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick()))()
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local VirtualInputManager = game:GetService("VirtualInputManager")

local successName, GameInfo = pcall(function() return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId) end)
local GameName = successName and GameInfo.Name or "Unknown Game"

-- [[ DATA STATE ]] --
local Player = Players.LocalPlayer
local Config = {
    Combat = {
        AutoParry = false,
        Distance = 5
    }
}

local BallShadow = nil
local BallObject = nil
local PreviousPosition = nil
local LastParry = 0

-- [[ UTILITIES ]] --
local function GetBallColor(target)
    if not target then return Color3.new(1, 1, 1) end
    local highlight = target:FindFirstChildOfClass("Highlight")
    if highlight then return highlight.FillColor end
    return target:IsA("Part") and target.Color or Color3.new(1, 1, 1)
end

local function GetVisualHeight(shadow)
    if not shadow then return 0 end
    return math.min(((math.max(0, shadow.Size.X - 5)) * 20) + 3, 100)
end

local function TriggerParry()
    VirtualInputManager:SendKeyEvent(true, Enum.KeyCode.F, false, game)
    VirtualInputManager:SendKeyEvent(false, Enum.KeyCode.F, false, game)
end

-- [[ AUTO PARRY CORE ]] --
local function IsRealTarget(char)
    for _, v in ipairs(char:GetChildren()) do
        if v:IsA("Highlight") and v.Name ~= "OSX_Chams" and v.Name ~= "OSX_Cham_Highlight" then
            return true
        end
    end
    return false
end

RunService.RenderStepped:Connect(function(dt)
    if not Config.Combat.AutoParry then return end
    
    BallShadow = (BallShadow and BallShadow.Parent) and BallShadow or workspace.FX:FindFirstChild("BallShadow")
    BallObject = (BallObject and BallObject.Parent) and BallObject or (workspace:FindFirstChild("Ball") or workspace:FindFirstChild("Part"))

    if not BallShadow or not BallObject or not Player.Character or not Player.Character.PrimaryPart then
        PreviousPosition = nil
        return
    end

    local rootPart = Player.Character.PrimaryPart
    local height = GetVisualHeight(BallShadow)
    local currentPos = Vector3.new(BallShadow.Position.X, BallShadow.Position.Y + height, BallShadow.Position.Z)

    if PreviousPosition then
        local velocityVec = (currentPos - PreviousPosition) / dt
        local velocity = velocityVec.Magnitude
        local ping = Player:GetNetworkPing()
        
        -- ตรวจสอบทิศทาง: ลูกบอลต้องพุ่งมาหาผู้เล่น (Dot Product)
        local directionToPlayer = (rootPart.Position - currentPos).Unit
        local isMovingToMe = velocityVec.Unit:Dot(directionToPlayer) > 0.5 -- ยิ่งเข้าใกล้ 1 คือยิ่งพุ่งมาตรงตัว
        
        local dynamicDistance = Config.Combat.Distance + (velocity * ping * 0.5)
        local distance = (rootPart.Position - currentPos).Magnitude

        -- ตรวจสอบ Highlight ที่ไม่ใช่ Chams
        local targetedByGame = IsRealTarget(Player.Character)

        if targetedByGame and isMovingToMe and GetBallColor(BallObject) ~= Color3.new(1, 1, 1) then
            if distance <= dynamicDistance and (tick() - LastParry) > 0.5 then
                TriggerParry()
                LastParry = tick()
            end
        end
    end

    PreviousPosition = currentPos
end)

-- 1. Create Window
local Window = OSX:CreateWindow({
    Title = "OSX HUB | " .. GameName,
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

-- 2. Info Tab
local InfoTab = Window:AddTab({
    Title = "Info",
    Icon = "info",
    SubDescription = "Information"
})

local ScriptInfo = InfoTab:AddPanel("Information")

ScriptInfo:AddInfoLabel("Owner", "darkmxde.")
ScriptInfo:AddInfoLabel("Developer", "LilYouDev1997x")
ScriptInfo:AddInfoLabel("Last Update", "10/10/2025")

ScriptInfo:AddWideButton({
    Title = "Join Discord",
    Description = "คลิกเพื่อคัดลอกลิงก์ Discord",
    Callback = function()
        setclipboard("https://discord.gg/osxhub")
        OSX:Notify({
            Title = "Discord",
            Content = "Link copied to clipboard!",
            Type = "Success"
        })
    end
})

-- 3. Main Tab (Example placeholder for future functions)
local MainTab = Window:AddTab({
    Title = "Main",
    Icon = "zap",
    SubDescription = "Primary Features"
})

local MainPanel = MainTab:AddPanel("Combat")

MainPanel:AddToggle({
    Title = "Auto Parry",
    Description = "Auto press F when ball is near",
    Default = false,
    Callback = function(Value)
        Config.Combat.AutoParry = Value
    end
})

MainPanel:AddSlider({
    Title = "Parry Distance",
    Description = "Distance to trigger auto parry (Studs)",
    Min = 0,
    Max = 50,
    Default = 5,
    Callback = function(Value)
        Config.Combat.Distance = Value
    end
})

-- Initial Notification
OSX:Notify({
    Title = "Death Ball",
    Content = "Script Loaded Successfully!",
    Type = "Success",
    Duration = 5
})
