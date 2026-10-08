
local successName, GameInfo = pcall(function() return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId) end)
local GameName = successName and GameInfo.Name or "Unknown Game"

-- [[ LIBRARY LOADER ]] --
local success, OSX = pcall(function()
    return loadstring(readfile("OSX_Lib.lua"))()
end)

if not success or not OSX then
    warn("OSX: Local file not found or failed to load, loading from GitHub...")
    local githubSuccess, githubOSX = pcall(function()
        return loadstring(game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick()))()
    end)
    if githubSuccess and githubOSX then
        OSX = githubOSX
    else
        error("OSX: Failed to load library from both local file and GitHub!")
    end
end

-- [[ CONFIGURATION ]] --
local Config = {
    Visuals = {
        PlayerChams = false,
        PlayerESPColor = Color3.fromRGB(0, 255, 120),
        ZombieBox = false,
        ZombieHealth = false,
        ZombieESPColor = Color3.fromRGB(255, 60, 60)
    },
    Combat = {
        HitboxEnabled = false,
        HitboxSize = Vector3.new(10, 10, 10)
    }
}

-- [[ SERVICES & PLAYERS ]] --
local Players = game:GetService("Players")
local v1 = Players.LocalPlayer

-- [[ UI INITIALIZATION ]] --
local Window = OSX:CreateWindow({
    Title = "OSX HUB | OUT EXECUTION",
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

-- [[ 1. INFO TAB ]] --
local Tab1 = Window:AddTab({ Title = "Info", Icon = "info", SubDescription = "Script Information" })

local DevPanel = Tab1:AddPanel("Developer Panel")
DevPanel:AddInfoLabel("Owner", "darkmxde.")
DevPanel:AddInfoLabel("Developer Main", "LilYouDev1997x")
DevPanel:AddInfoLabel("Developer Support", "0b1100001cat")

DevPanel:AddButton({
    Title = "Join Discord",
    Description = "คลิกเพื่อคัดลอกลิงก์ Discord",
    Callback = function()
        setclipboard("https://discord.gg/osxhub")
        OSX:Notify({Title = "Clipboard", Content = "Discord Link Copied!"})
    end
})

-- [[ 2. VISUALS TAB ]] --
local Tab2 = Window:AddTab({ Title = "Visuals", Icon = "eye", SubDescription = "ESP & Visuals" })
local VisualsPanel = Tab2:AddPanel("Player ESP")

VisualsPanel:AddToggle({
    Title = "Player Chams",
    Description = "แสดงออร่า Chams มองทะลุผู้เล่นทั้งหมด",
    Default = false,
    Callback = function(v) 
        Config.Visuals.PlayerChams = v 
    end
})

local ZombieVisualsPanel = Tab2:AddPanel("Zombie ESP")

ZombieVisualsPanel:AddToggle({
    Title = "Zombie 2D Box",
    Description = "แสดงกล่อง 2D Corner Box รอบตัวซอมบี้ทั้งหมด",
    Default = false,
    Callback = function(v) 
        Config.Visuals.ZombieBox = v 
    end
})

ZombieVisualsPanel:AddToggle({
    Title = "Zombie Health Bar",
    Description = "แสดงแถบเลือดของซอมบี้ (แยกเปิด/ปิดได้)",
    Default = false,
    Callback = function(v) 
        Config.Visuals.ZombieHealth = v 
    end
})

-- [[ 3. COMBAT TAB ]] --
local Tab3 = Window:AddTab({ Title = "Combat", Icon = "target", SubDescription = "Combat & Hitbox" })
local CombatPanel = Tab3:AddPanel("Hitbox Options")

CombatPanel:AddToggle({
    Title = "Zombie Hitbox",
    Description = "ขยายขนาด Hitbox ของซอมบี้ทั้งหมด",
    Default = false,
    Callback = function(v) 
        Config.Combat.HitboxEnabled = v 
    end
})

-- [[ LOGIC: ESP UPDATER ]] --
local PlayerESP = {}
local ZombieESP = {}

local function ApplyHighlight(instance, color)
    local highlight = instance:FindFirstChild("OSX_Chams")
    if not highlight then
        highlight = Instance.new("Highlight")
        highlight.Name = "OSX_Chams"
        highlight.Adornee = instance
        highlight.DepthMode = Enum.HighlightDepthMode.AlwaysOnTop
        highlight.FillTransparency = 0.5
        highlight.OutlineTransparency = 0
        highlight.Parent = instance
    end
    highlight.FillColor = color
    highlight.OutlineColor = color
    highlight.Enabled = true
end

local function RemoveHighlight(instance)
    local highlight = instance:FindFirstChild("OSX_Chams")
    if highlight then
        pcall(function() highlight:Destroy() end)
    end
end

local function CreateZombieBox(instance, color)
    local targetPart = instance:FindFirstChild("HumanoidRootPart") or instance:FindFirstChildOfClass("BasePart")
    if not targetPart then return end

    local billboard = Instance.new("BillboardGui")
    billboard.Name = "OSX_ZombieBox"
    billboard.AlwaysOnTop = true
    billboard.Size = UDim2.new(4.5, 0, 5.5, 0)
    billboard.Adornee = targetPart
    billboard.Parent = instance
    billboard.Enabled = false

    local container = Instance.new("Frame")
    container.BackgroundTransparency = 1
    container.Size = UDim2.new(1, 0, 1, 0)
    container.Parent = billboard

    local thickness = 2.5
    local length = 0.22

    local function makeLine(pos, sz)
        local line = Instance.new("Frame")
        line.BackgroundColor3 = color
        line.BorderSizePixel = 0
        line.Position = pos
        line.Size = sz
        line.Parent = container
        return line
    end

    local lines = {
        makeLine(UDim2.new(0, 0, 0, 0), UDim2.new(0, thickness, length, 0)),
        makeLine(UDim2.new(0, 0, 0, 0), UDim2.new(length, 0, 0, thickness)),
        makeLine(UDim2.new(1, -thickness, 0, 0), UDim2.new(0, thickness, length, 0)),
        makeLine(UDim2.new(1 - length, 0, 0, 0), UDim2.new(length, 0, 0, thickness)),
        makeLine(UDim2.new(0, 0, 1 - length, 0), UDim2.new(0, thickness, length, 0)),
        makeLine(UDim2.new(0, 0, 1, -thickness), UDim2.new(length, 0, 0, thickness)),
        makeLine(UDim2.new(1, -thickness, 1 - length, 0), UDim2.new(0, thickness, length, 0)),
        makeLine(UDim2.new(1 - length, 0, 1, -thickness), UDim2.new(length, 0, 0, thickness)),
    }

    return billboard
end

local function CreateZombieHPBar(instance)
    local targetPart = instance:FindFirstChild("HumanoidRootPart") or instance:FindFirstChildOfClass("BasePart")
    if not targetPart then return end

    local billboard = Instance.new("BillboardGui")
    billboard.Name = "OSX_ZombieHP"
    billboard.AlwaysOnTop = true
    billboard.Size = UDim2.new(0.2, 0, 3, 0)
    billboard.StudsOffset = Vector3.new(-1.8, 0, 0)
    billboard.Adornee = targetPart
    billboard.Parent = instance
    billboard.Enabled = false

    local bg = Instance.new("Frame")
    bg.Name = "BG"
    bg.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    bg.BorderSizePixel = 0
    bg.Size = UDim2.new(1, 0, 1, 0)
    bg.Parent = billboard

    local fill = Instance.new("Frame")
    fill.Name = "Fill"
    fill.BackgroundColor3 = Color3.fromRGB(0, 255, 0)
    fill.BorderSizePixel = 0
    fill.Size = UDim2.new(1, 0, 1, 0)
    fill.Position = UDim2.new(0, 0, 0, 0)
    fill.Parent = bg

    return billboard
end

local function UpdatePlayerESP(chamsEnabled, folder, targetTable, color)
    if chamsEnabled and folder then
        for _, item in ipairs(folder:GetChildren()) do
            if item:IsA("Model") and item.Name ~= v1.Name then
                local isDead = false
                local hum = item:FindFirstChildOfClass("Humanoid")
                if hum and hum.Health <= 0 then
                    isDead = true
                end

                if not isDead then
                    ApplyHighlight(item, color)
                    targetTable[item] = true
                else
                    RemoveHighlight(item)
                end
            end
        end
    end
    
    for instance, _ in pairs(targetTable) do
        local isDead = false
        if instance and instance.Parent then
            local hum = instance:FindFirstChildOfClass("Humanoid")
            if hum and hum.Health <= 0 then
                isDead = true
            end
        else
            isDead = true
        end

        if isDead or not chamsEnabled then
            pcall(function()
                RemoveHighlight(instance)
            end)
            targetTable[instance] = nil
        end
    end
end

local function UpdateZombieESP(boxEnabled, healthEnabled, folder, targetTable, color)
    if (boxEnabled or healthEnabled) and folder then
        for _, item in ipairs(folder:GetChildren()) do
            if item:IsA("Model") then
                local isDead = false
                local hum = item:FindFirstChildOfClass("Humanoid")
                if hum and hum.Health <= 0 then
                    isDead = true
                end

                if not isDead then
                    targetTable[item] = true
                    
                    local box = item:FindFirstChild("OSX_ZombieBox")
                    if boxEnabled then
                        if not box then
                            box = CreateZombieBox(item, color)
                        end
                        if box then
                            box.Enabled = true
                        end
                    else
                        if box then
                            pcall(function() box:Destroy() end)
                        end
                    end
                    
                    local hpBar = item:FindFirstChild("OSX_ZombieHP")
                    if healthEnabled then
                        if not hpBar then
                            hpBar = CreateZombieHPBar(item)
                        end
                        if hpBar and hum then
                            hpBar.Enabled = true
                            local fill = hpBar.BG.Fill
                            local healthPercent = math.clamp(hum.Health / hum.MaxHealth, 0, 1)
                            fill.Size = UDim2.new(1, 0, healthPercent, 0)
                            fill.Position = UDim2.new(0, 0, 1 - healthPercent, 0)
                            fill.BackgroundColor3 = Color3.fromRGB(255, 0, 0):Lerp(Color3.fromRGB(0, 255, 0), healthPercent)
                        end
                    else
                        if hpBar then
                            hpBar.Enabled = false
                        end
                    end
                else
                    local box = item:FindFirstChild("OSX_ZombieBox")
                    if box then pcall(function() box:Destroy() end) end
                    local hpBar = item:FindFirstChild("OSX_ZombieHP")
                    if hpBar then pcall(function() hpBar:Destroy() end) end
                end
            end
        end
    end

    for instance, _ in pairs(targetTable) do
        local isDead = false
        if instance and instance.Parent then
            local hum = instance:FindFirstChildOfClass("Humanoid")
            if hum and hum.Health <= 0 then
                isDead = true
            end
        else
            isDead = true
        end

        if isDead or (not boxEnabled and not healthEnabled) then
            pcall(function()
                local box = instance:FindFirstChild("OSX_ZombieBox")
                if box then box:Destroy() end
                local hpBar = instance:FindFirstChild("OSX_ZombieHP")
                if hpBar then hpBar:Destroy() end
            end)
            targetTable[instance] = nil
        end
    end
end
local function expandHitbox(zombie)
    local hrp = zombie:FindFirstChild("HumanoidRootPart")
    if hrp then
        if Config.Combat.HitboxEnabled then
            -- Check if custom hitbox already exists
            local hasHitbox = false
            for _, child in ipairs(zombie:GetChildren()) do
                if child:GetAttribute("OSX_Hitbox") then
                    hasHitbox = true
                    -- Update size if it changed
                    if child.Size ~= Config.Combat.HitboxSize then
                        child.Size = Config.Combat.HitboxSize
                    end
                    break
                end
            end

            if not hasHitbox then
                local hitbox = Instance.new("Part")
                hitbox.Size = Config.Combat.HitboxSize
                hitbox.Transparency = 1
                hitbox.CanCollide = false
                hitbox.Massless = true
                hitbox.CFrame = hrp.CFrame
                hitbox:SetAttribute("OSX_Hitbox", true)
                hitbox.Name = "HumanoidRootPart" -- ใช้ชื่อ HumanoidRootPart เพื่อให้สคริปต์อาวุธโจมตีโดน
                hitbox.Parent = zombie

                local weld = Instance.new("WeldConstraint")
                weld.Part0 = hitbox
                weld.Part1 = hrp
                weld.Parent = hitbox
            end
        else
            -- ลบ custom hitbox ออกถ้าปิดใช้งาน
            for _, child in ipairs(zombie:GetChildren()) do
                if child:GetAttribute("OSX_Hitbox") then
                    pcall(function() child:Destroy() end)
                end
            end
        end
    end
end

task.spawn(function()
    while true do
        local PlayersFolder = workspace:FindFirstChild("Players") or workspace:FindFirstChild("AlivePlayers")
        UpdatePlayerESP(
            Config.Visuals.PlayerChams,
            PlayersFolder,
            PlayerESP,
            Config.Visuals.PlayerESPColor
        )

        local ZombiesFolder = workspace:FindFirstChild("Zombies") or workspace:FindFirstChild("AliveZombies")
        UpdateZombieESP(
            Config.Visuals.ZombieBox,
            Config.Visuals.ZombieHealth,
            ZombiesFolder,
            ZombieESP,
            Config.Visuals.ZombieESPColor
        )

        -- Update hitboxes for ZombiesFolder
        if ZombiesFolder then
            for _, zombie in ipairs(ZombiesFolder:GetChildren()) do
                if zombie:IsA("Model") then
                    expandHitbox(zombie)
                end
            end
        end

        -- Update hitboxes for workspace.Camera
        if workspace:FindFirstChild("Camera") then
            for _, zombie in ipairs(workspace.Camera:GetChildren()) do
                if zombie.Name == "m_Zombie" then
                    expandHitbox(zombie)
                end
            end
        end

        task.wait(1)
    end
end)

OSX:Notify({
    Title = "OSX HUB",
    Content = GameName .. " script ready!",
    Type = "Success"
})